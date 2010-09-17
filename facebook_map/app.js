require.paths.unshift(__dirname);

var http = require('http'),
    sys = require('sys'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    opts = require('./approot/libs/opts'),
    Router = require('./approot/libs/biggie-router'),
    SessionManager = require('./approot/libs/tc/sessionManager'),
    Logging = require('./approot/libs/tc/logging'),
    string = require('./approot/libs/string'),
    sax = require('./approot/libs/sax'),
    xml = require('./approot/libs/xml2js'),
    utils = require('./approot/libs/tc/utils'),
    gmail = require('./approot/gmail'),
    FBInterface = require('./approot/facebook').FBInterface,
    FBUser = require('./approot/facebook').FBUser;

var logging = new Logging();

var environment;
try{
  environment = require('../env.js');
}catch(err){
  logging.info('Cannot load ../env.js. Using Default environment.');
  environment = {
    port:8123,
    hostname:'localhost',
    facebook:{
      app_id:'',
      app_secret:''
    }
  }
}

var app = {
  name:'facebook_friends',
  version:0.1,
  option_settings:[
    {
      short       : 'v',
      long        : 'verbose',
      description : 'Prints a whole lot more. NOT IMPLEMENTED',
      value       : true
    }
  ],
  openPolls:[],
  sessions:new SessionManager(),
  router:new Router()
}

app.initialize = function(){
  logging.info('app.initialize: '+environment.hostname+":"+environment.port);
  opts.parse(app.option_settings);
  this.router.listen(environment.port);
  this.setup_routes();
}

app.setup_routes = function(){
  logging.info('app.setup_routes');
  this.router.bind(app.session);
  this.router.get('/').bind(app.home);
  this.router.get('/user').bind(app.user);
  this.router.get(/fb_redirect/)
    .bind(app.authenticate).bind(app.getUserDetails);
  this.router.get(/\/user\/graph[\/$A-z]/).bind(app.graphData);
  this.router.bind(app.staticFile);
  this.router.bind(app.unhandledRequest);
}

app.session = function(req,res,next){
  logging.info('app.session');
  if(req.headers.cookie){
    req.session_id = req.headers.cookie;
  }
  if(!req.session_id){ req.session_id = utils.randomStr(32); }
  req.session = app.sessions.getSession(req.session_id);
  next();
}

app.home = function(req,res,next){
  logging.info('app.home');
  req.url = '/index.html';
  next();
}

app.user = function(req,res,next){
  logging.info('app.user');
  if(req.session.user){
    if(req.session.user.getAccessToken()){
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({user:req.session.user}));
    } else {
      req.session.user.fetchAccessToken();
      req.session.user.events.on('accessTokenFetched',function(){
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({user:req.session.user}));
      });
    }
  } else {
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({redirect:FBUser.getLoginUrl(environment)}));
  }
}

app.authenticate = function(req,res,next){
  if(!req.session.user){
    req.session.user = new FBUser(environment);
  }
  req.session.user.authenticate(req,res,next);
}

app.getUserDetails = function(req,res,next){
  logging.info('app.getUserDetails');
  if(req.session.user && req.session.user.authenticated){
    (function(){
      var fbi;
      fbi = new FBInterface(req.session.user,environment);
      fbi.events.on('graphDataAvailable',function(d){
          req.session.user.data[d.uri] = d.data
          res.writeHead(303,{'Location':'/','Set-Cookie':req.session_id});
          res.end("");
      });
      fbi.events.on('graphDataNotAvailable',function(d){
          res.writeHead(500,{'Content-Type':'application/json'});
          res.end(JSON.stringify({message:'Could not instantiate User.',status:500}));
      });
      fbi.fetchGraphData('/me');
    })(req,res,next);
  } else {
    app.authenticate(req,res,next);
  }
}

app.graphData = function(req,res,next){
  logging.info('app.graphData');
  if(req.session.user && req.session.user.authenticated){
    (function(){
      var fbi;
      fbi = new FBInterface(req.session.user,environment);
      fbi.events.on('graphDataAvailable',function(d){
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify(d));
      });
      fbi.events.on('graphDataNotAvailable',function(d){
        res.writeHead(500,{'Content-Type':'application/json'});
        res.end(JSON.stringify({message:'Data not available.',status:500}));
      });
      fbi.fetchGraphData(req.url.replace('/user/graph',''));
    })(req,res,next);
  }
}

app.staticFile = function(req,res,next){
  logging.info('app.staticFile: '+sys.inspect(req.url));
  var filename = path.join(process.cwd()+'/webroot/', req.url);
  path.exists(filename, function(exists) {  
    if(!exists) {
        next();
        return;
    }
    fs.readFile(filename, "binary", function(err, file) {  
      if(err) {  
        res.writeHead(500, {"Content-Type": "application/json"});
        res.end(JSON.stringify({'message':err, 'status':500}));
        return;
      }
      res.writeHead(200);  
      res.write(file, "binary");  
      res.end();
    });  
  });
}

app.unhandledRequest = function(req,res,next){
  logging.info('app.unhandledRequest: '+sys.inspect(req.url));
  res.writeHead(404,{'Content-Type':'application/json'});
  res.end(JSON.stringify({'message':'Resource Not Found', 'status':404}));
}

app.initialize();
