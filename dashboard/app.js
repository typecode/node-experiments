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
    gmail = require('./approot/gmail');

var app = {
  name:'dashboard',
  version:0.1,
  fetchers:[],
  option_settings:[
    {
      short       : 'a',
      long        : 'accounts',
      description : 'Path to Accounts File',
      value       : true
    }
  ],
  accounts:null,
  router:new Router()
}

app.initialize = function(){
  opts.parse(app.option_settings);
  
  try{
    this.accounts = require(opts.get('accounts')).accounts;
  }catch(error) {
    console.log('Accounts File Not Found! Exiting.');
    return false;
  }
  
  if(!this.accounts){
    console.log('No Accounts Loaded! Exiting.');
    return false;
  }
  
  for(var i in this.accounts){
    var _fetcher = new gmail.fetcher;
    _fetcher.initialize(app.accounts[i]);
    _fetcher.events.on('gmailReceived',this.gmailReceived);
    this.fetchers.push(_fetcher);
  }
  
  this.router.listen(8123);
  this.setup_routes();
}

app.setup_routes = function(){
  this.router.get('/').get('/index.html').bind(app.getIndex);
  this.router.get('/inboxes').bind(app.getUpdates);
  this.router.bind(app.unhandledRequest);
}

app.getIndex = function(req,res,next){
  var uri = url.parse(req.url).pathname;
  if(uri == "/"){ uri = 'index.html'; }
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

app.getUpdates = function(req,res,next){
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({'message':'UPDATES'}));
}

app.unhandledRequest = function(req,res,next){
  res.writeHead(404,{'Content-Type':'application/json'});
  res.end(JSON.stringify({'message':'Resource Not Found'}));
}

app.gmailReceived = function(data){
  var parser = new xml.Parser();
  parser.addListener('end', function(result) {
    var output = result.title+" ->";
    output = output.rpad(' ',55) + result.fullcount + ' |';
    for(var i = 0; i < result.fullcount; i++){
      output = output + "#";
    }
    console.log(output);
  });
  parser.parseString(data);
}

app.initialize();

