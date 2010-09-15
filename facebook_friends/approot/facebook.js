var http = require('http'),
  sys = require('sys'),
  events = require('events'),
  url = require('url'),
  utils = require('./libs/utils');

var FBInterface = function(app_id,app_secret){
  var _me, conf;
  _me = this;
  
  conf = {
    app_id:app_id,
    app_secret:app_secret
  }
  
  this.getLoginUrl = function(){
    return 'https://graph.facebook.com/oauth/authorize?'+
      'client_id='+conf.app_id+
      '&redirect_uri=http://localhost:8123/fb_redirect';
  }
  
  this.authenticate = function(req,res,next){
    var _code;
    if(!req.session.user){
      req.session.user = new FBUser(conf);
    }
    if(_code = url.parse(req.url,true).query.code){
      req.session.user.setCode(_code);
    }
    next();
  }
  
};

var FBUser = function(conf){
  var _me, conf, _graph, credentials, access_token, code;
  _me = this;
  conf = conf;
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
    var facebook = http.createClient(80, 'graph.facebook.com');
    var request = facebook.request('GET', '/oauth/access_token?'+
      'client_id='+conf.app_id+'&'+
      'redirect_uri=http://localhost:8123/fb_redirect&'+
      'client_secret='+conf.app_secret+'&'+
      'code='+credentials.code,
      {'host': 'graph.facebook.com'});
    request.end();
    request.on('response', function (response) {
      var _body = "";
      response.on('data', function (chunk) {
        _body += chunk;
      });
      response.on('end', function () {
        credentials.access_token = _body.substring(_body.indexOf('=')+1,_body.indexOf('&'));
        _me.authenticated = true;
        _me.events.emit('accessTokenFetched');
      });
    });
  }
  
  this.fetchGraphData = function(uri){
    var facebook = http.createClient(443, 'graph.facebook.com', true);
    var request = facebook.request('GET', uri+
    '?access_token='+credentials.access_token,
      {'host': 'graph.facebook.com'});
    request.end();
    request.on('response', function (response) {
      var _body = "";
      response.on('data', function (chunk) {
        _body += chunk;
      });
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