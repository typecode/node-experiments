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
    FBInterface = require('./approot/facebook');

var logging = new Logging();

var environment = {
  port:8123,
  hostname:'localhost',
  facebook:{
    app_id:'',
    app_secret:''
  }
}

var app = {
  name:'facebook_map',
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
  router:new Router(),
  facebook:{
    interface:new FBInterface(environment)
  }
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
  this.router.get('/favicon.ico').bind(app.favicon);
  this.router.get('/').bind(app.home);
  this.router.get('/user').bind(app.user);
  
  this.router.get(/fb_redirect/)
    .bind(app.facebook.interface.authenticate).bind(function(req,res,next){
      res.writeHead(303,{'Location':'/','Set-Cookie':req.session_id});
      res.end("");
    });
  this.router.get(/\/user\/graph[\/$A-z]/).bind(app.graphData);
  this.router.get(/\/user\/friends/).bind(app.userFriends);
  this.router.bind(app.unhandledRequest);
}

app.session = function(req,res,next){
  logging.info('app.session');
  if(req.headers.cookie){
    req.session_id = req.headers.cookie;
  } else {
    logging.dump(req.headers);
  }
  if(!req.session_id){ req.session_id = utils.randomStr(12); }
  req.session = app.sessions.getSession(req.session_id);
  next();
}

app.favicon = function(){
  
}

app.home = function(req,res,next){
  logging.info('app.home');
  app.getHTML('index.html',req,res,next);
}

app.graphData = function(req,res,next){
  logging.info('app.graphData');
  var _uri;
  if(req.session.user && req.session.user.authenticated){
    req.session.user.events.on('graphDataAvailable',function(d){
      if(d.uri == _uri){
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify(d));
      }
    });
    req.session.user.events.on('graphDataNotAvailable',function(d){
      if(d.uri == _uri){
        res.writeHead(500,{'Content-Type':'application/json'});
        res.end(JSON.stringify({message:'Data not avalable.',uri:_uri}));
      }
    });
    _uri = req.url.replace('/user/graph','');
    req.session.user.fetchGraphData(_uri);
  }
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
    res.end(JSON.stringify({redirect:app.facebook.interface.getLoginUrl()}));
  }
}

app.userFriends = function(req,res,next){
  logging.info('app.userFriends');
  req.session.user.events.on('graphDataNotAvailable',function(d){
    logging.dump(d);
    res.writeHead(500,{'Content-Type':'application/json'});
    res.end(JSON.stringify({message:'Data not avalable.',uri:d.uri}));
  });
  
  req.session.user.events.on('graphDataAvailable',function(d){
    res.writeHead(200,{'Content-Type':'application/json'});
    d.data.data.forEach(function(i){
      req.session.user.fetchGraphData('/me/friends');
      logging.dump(i);
    })
  });
  
  req.session.user.fetchGraphData('/me/friends');
}

app.unhandledRequest = function(req,res,next){
  logging.info('app.unhandledRequest: '+sys.inspect(req.url));
  res.writeHead(404,{'Content-Type':'application/json'});
  res.end(JSON.stringify({'message':'Resource Not Found'}));
}

app.getHTML = function(uri,req,res,next){
  logging.info('app.getHTML');
  var filename = path.join(process.cwd()+'/webroot/', uri);  
  path.exists(filename, function(exists) {  
    if(!exists) {
        res.writeHead(404, {"Content-Type": "text/plain"});  
        res.write("404 Not Found\n");  
        res.end();  
        return;  
    }
      
    fs.readFile(filename, "binary", function(err, file) {  
      if(err) {  
        res.writeHead(500, {"Content-Type": "text/plain"});  
        res.write(err + "\n");  
        res.end();  
        return;  
      }  

      res.writeHead(200);  
      res.write(file, "binary");  
      res.end();  
    });  
  });
}

app.initialize();
