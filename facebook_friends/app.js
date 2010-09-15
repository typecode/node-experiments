require.paths.unshift(__dirname);

var http = require('http'),
    sys = require('sys'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    opts = require('./approot/libs/opts'),
    Router = require('./approot/libs/biggie-router'),
    SessionManager = require('./approot/libs/sessionManager'),
    string = require('./approot/libs/string'),
    sax = require('./approot/libs/sax'),
    xml = require('./approot/libs/xml2js'),
    utils = require('./approot/libs/utils'),
    gmail = require('./approot/gmail'),
    FBInterface = require('./approot/facebook');

var app = {
  name:'facebook_friends',
  port:8123,
  version:0.1,
  openPolls:[],
  option_settings:[
    {
      short       : 'p',
      long        : 'port',
      description : 'Sets the port to use. NOT IMPLEMENTED',
      value       : true
    },
    {
      short       : 'v',
      long        : 'verbose',
      description : 'Prints a whole lot more. NOT IMPLEMENTED',
      value       : true
    }
  ],
  sessions:new SessionManager(),
  router:new Router(),
  facebook:{
    interface:new FBInterface('161098813904458','372c7cbc6562ff2729e2c5cca5f5a3ff')
  }
}

app.initialize = function(){
  opts.parse(app.option_settings);
  this.router.listen(app.port);
  this.setup_routes();
}

app.setup_routes = function(){
  this.router.bind(app.session)
  this.router.get('/').bind(app.home);
  this.router.get('/user').bind(app.user);
  this.router.get(/\/user\/graph[\/$A-z]/).bind(app.graphData);
  this.router.get(/fb_redirect/)
    .bind(app.facebook.interface.authenticate).bind(function(req,res,next){
      res.writeHead(303,{'Location':'/'});
      res.end("");
    });
  this.router.bind(app.unhandledRequest);
}

app.session = function(req,res,next){
  if(req.headers.cookie){
    req.session_id = req.headers.cookie;
  }
  if(!req.session_id){ req.session_id = utils.randomStr(12); }
  req.session = app.sessions.getSession(req.session_id);
  next();
}

app.home = function(req,res,next){
  app.getHTML('index.html',req,res,next);
}

app.graphData = function(req,res,next){
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
  if(req.session.user){
    if(req.session.user.getAccessToken()){
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({user:req.session.user}));
    } else {
      req.session.user.fetchAccessToken();
      req.session.user.events.on('accessTokenFetched',function(){
        res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':req.session_id});
        res.end(JSON.stringify({user:req.session.user}));
      });
    }
  } else {
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({redirect:app.facebook.interface.getLoginUrl()}));
  }
}

app.unhandledRequest = function(req,res,next){
  res.writeHead(404,{'Content-Type':'application/json'});
  res.end(JSON.stringify({'message':'Resource Not Found'}));
}

app.getHTML = function(uri,req,res,next){
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

