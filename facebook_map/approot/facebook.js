var http = require('http'),
  sys = require('sys'),
  events = require('events'),
  url = require('url'),
  utils = require('./libs/tc/utils');
  Logging = require('./libs/tc/logging');
var logging = new Logging();

var FBInterface = function(environment){
  var _me;
  _me = this;
  
  this.getLoginUrl = function(){
    return 'https://graph.facebook.com/oauth/authorize?'+
      'client_id='+environment.facebook.app_id+
      '&redirect_uri=http://'+environment.hostname+':'+environment.port+'/fb_redirect';
      //'&scope=offline_access';
  }
  
  this.authenticate = function(req,res,next){
    var _code;
    if(!req.session.user){
      req.session.user = new FBUser(environment);
    }
    if(_code = url.parse(req.url,true).query.code){
      req.session.user.setCode(_code);
    }
    next();
  }
  
};

var FBUser = function(environment){
  var _me, _graph, credentials, access_token, code;
  _me = this;
  credentials = {};
  _graph = {};
  
  this.events = new events.EventEmitter();
  this.authenticated = false;
  
  this.getAccessToken = function(){
    return credentials.access_token;
  }
  this.setAccessToken = function(new_access_token){
    credentials.access_token = new_access_token;
  }
  this.fetchAccessToken = function(){
    logging.info('this.fetchAccessToken');
    var facebook = http.createClient(80, 'graph.facebook.com');
    var request = facebook.request('GET', '/oauth/access_token?'+
      'client_id='+environment.facebook.app_id+'&'+
      'redirect_uri=http://'+environment.hostname+':'+environment.port+'/fb_redirect&'+
      'client_secret='+environment.facebook.app_secret+'&'+
      'code='+credentials.code,
      {'host': 'graph.facebook.com'});
    request.end();
    request.on('response', function (response) {
      var _body = "";
      response.on('data', function (chunk) {
        _body += chunk;
      });
      response.on('end', function () {
        if(_body.indexOf('&') != -1){
          credentials.access_token = _body.substring(_body.indexOf('=')+1,_body.indexOf('&'));
        } else {
          credentials.access_token = _body.substring(_body.indexOf('=')+1,_body.length);
        }
        _me.authenticated = true;
        _me.events.emit('accessTokenFetched');
      });
    });
  }
  
  this.fetchGraphData = function(uri){
    logging.info('this.fetchGraphData');
    var myuri, facebook, request;
    myuri = ""+uri;
    if(myuri.indexOf("?") == -1){ myuri += "?"; };
    myuri += '&access_token='+credentials.access_token;
    facebook = http.createClient(443, 'graph.facebook.com', true);
    request = facebook.request('GET', myuri, {'host': 'graph.facebook.com'});
    request.end();
    request.on('response', function (response) {
      var _body = "";
      response.on('data', function (chunk) { _body += chunk; });
      response.on('end', function () {
        try{
          _graph[uri] = JSON.parse(_body);
          _me.events.emit('graphDataAvailable',{'uri':uri,data:_graph[uri]});
        }catch(error){
          console.log(error);
          _me.events.emit('graphDataNotAvailable',{'uri':uri});
        }
        
      });
    });
  }
  
  this.setCode = function(code){
    credentials.code = code;
  }
}

if (module.exports) {
  module.exports = FBInterface;
}