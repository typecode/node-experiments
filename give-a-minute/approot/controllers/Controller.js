var sys = require('sys'),
    Logging = require('../libs/tc.logging');

var logging = new Logging();
var Controller = function(){
  
}

Controller.prototype.json = function(req,res,next,obj){
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify(obj));
}

Controller.prototype.OK = function(req,res,next){
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({status:'OK'}));
}

Controller.prototype.ERROR = function(req,res,next,json){
  res.writeHead(500,{'Content-Type':'application/json'});
  res.end(JSON.stringify(json));
}

if (module.exports) {
  module.exports = Controller;
}