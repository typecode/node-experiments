require.paths.unshift(__dirname);


    // Node.JS LIBS-------------------------------------------------------------
var http = require('http'),
    sys = require('sys'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    events = require('events'),
    
    // 3rd PARTY LIBS-----------------------------------------------------------
    opts = require('./approot/libs/opts'),
    Router = require('../libs/biggie-router/lib/biggie-router'),
    mongoose = require('../libs/mongoose/mongoose').Mongoose,
    sax = require('./approot/libs/sax'),
    xml = require('../libs/xml2js/lib'),
    
    // TC LIBS------------------------------------------------------------------
    SessionManager = require('./approot/libs/tc.sessionManager'),
    Logging = require('./approot/libs/tc.logging'),
    utils = require('./approot/libs/tc.utils'),
    gmail = require('./approot/libs/tc.gmail'),
    facebook = require('./approot/libs/tc.facebook'),
    
    // MODELS--------------------------------------------------------------
    question = require('./approot/models/question'),
    answer = require('./approot/models/answer'),
    
    // CONTROLLERS--------------------------------------------------------------
    Controller = require('./approot/controllers/Controller'),
    User = require('./approot/controllers/User').User,
    //FBUser = require('./approot/controllers/User').FBUser,
    Question = require('./approot/controllers/Question');

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
    },
    salt:12345
  }
}

var app = {
  name:'give-a-minute',
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
    User:new User(environment),
    //FBUser:new FBUser(environment),
    Question:new Question(environment)
  },
  events:new events.EventEmitter(),
  db:mongoose.connect('mongodb://localhost/db'),
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
  this.router.post('/user/login').bind(app.controllers.User.login);
  this.router.post('/user/register').bind(app.controllers.User.register);
  this.router.get('/question/create').bind(app.controllers.Question.create);
  this.router.post('/question/answer').bind(app.controllers.Question.answer);
  this.router.get(/\/question\/[a-zA-Z0-9]*\/answers\/new/)
    .bind(app.controllers.Question.answerspoll);
  this.router.get(/\/question\/[a-zA-Z0-9]*\/answers/)
    .bind(app.controllers.Question.answers);
  this.router.get('/question/all').bind(app.controllers.Question.all);
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

app.questions = function(req,res,next){
  logging.info('app.questions');
  app.controllers.Question.all.call(app,req,res,next);
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

global.app = app;
app.initialize();

/*::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::*/