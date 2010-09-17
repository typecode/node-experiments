require.paths.unshift(__dirname);


    // Node.JS LIBS-------------------------------------------------------------
var http = require('http'),
    sys = require('sys'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    
    // 3rd PARTY LIBS-----------------------------------------------------------
    opts = require('./approot/libs/opts'),
    Router = require('./approot/libs/biggie-router'),
    sax = require('./approot/libs/sax'),
    xml = require('./approot/libs/xml2js'),
    
    // TC LIBS------------------------------------------------------------------
    SessionManager = require('./approot/libs/tc.sessionManager'),
    Logging = require('./approot/libs/tc.logging'),
    utils = require('./approot/libs/tc.utils'),
    gmail = require('./approot/libs/tc.gmail'),
    facebook = require('./approot/libs/tc.facebook'),
    
    // CONTROLLERS--------------------------------------------------------------
    Controller = require('./approot/controllers/Controller');
    User = require('./approot/controllers/User');

/*::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::*/

var logging = new Logging();

var environment;

try {
  environment = require('../env.js');
} catch(err){
  logging.info('Cannot load ../env.js. Using Default environment.');
  environment = {
    port:8123,
    hostname:'localhost',
    facebook:{
      app_id:'',
      app_secret:''
    },
    cloudmade:{
      api_key:''
    }
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
  user:{},
  openPolls:[],
  controllers:{
    Controller:new Controller(environment),
    User:new User(environment)
  },
  sessions:new SessionManager(),
  router:new Router()
}

/*::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::*/

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
  this.router.get('/user').bind(app.controllers.User.user);
  this.router.get('/user/login').bind(app.controllers.User.login);
  this.router.get('/user/freinds').bind(app.controllers.User.freinds);
  this.router.get(/fb_redirect/).bind(app.controllers.User.authenticate);
  this.router.get(/\/user\/graph[\/$A-z]/).bind(app.controllers.User.graphData);
  this.router.bind(app.staticFile);
  this.router.bind(app.unhandledRequest);
}

app.session = function(req,res,next){
  //logging.info('app.session');
  if(req.headers.cookie){
    req.session_id = (function(cookie){
      var nameEQ = "tcsession=";
      var ca = cookie.split(';');
      for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
    })(req.headers.cookie);
  }
  app.sessions.getSession(req,res,next);
}

app.home = function(req,res,next){
  logging.info('app.home');
  req.url = '/index.html';
  next();
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

/*::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::*/

app.initialize();

/*::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::*/