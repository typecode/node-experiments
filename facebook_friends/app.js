require.paths.unshift(__dirname);

var http = require('http'),
    sys = require('sys'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    opts = require('./approot/libs/opts'),
    Router = require('./approot/libs/biggie-router'),
    string = require('./approot/libs/string'),
    sax = require('./approot/libs/sax'),
    xml = require('./approot/libs/xml2js'),
    gmail = require('./approot/gmail'),
    FBInterface = require('./approot/facebook');

var app = {
  name:'facebook_friends',
  port:8123,
  version:0.1,
  openPolls:[],
  option_settings:[
    {
      short       : 'a',
      long        : 'accounts',
      description : 'Path to Accounts File',
      value       : true
    }
  ],
  accounts:null,
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
  this.router.get('/').get('/index.html').bind(app.home);
  this.router.get('/user').bind(app.user);
  this.router.get(/fb_redirect/).bind(app.facebook.interface.auth).bind(app.home);
  this.router.bind(app.unhandledRequest);
}

app.home = function(req,res,next){
  app.getHTML('index.html',req,res,next);
}

app.user = function(req,res,next){
  res.writeHead(200,{'Content-Type':'application/json'});
  if(app.facebook.interface.user){
    res.end(sys.inspect(app.facebook.interface.user));
  } else {
    res.end(JSON.stringify({}));
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

