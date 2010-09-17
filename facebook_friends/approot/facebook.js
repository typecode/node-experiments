var http = require('http'),
  sys = require('sys'),
  events = require('events'),
  url = require('url'),
  utils = require('./libs/tc/utils');
  Logging = require('./libs/tc/logging');
var logging = new Logging();

var FBInterface = function(user,environment){
  var _me;
  _me = this;
  
  this.events = new events.EventEmitter();

  this.fetchGraphData = function(uri){
    logging.info('this.fetchGraphData');
    var access_token, myuri, facebook, request;
    try{
      access_token = user.getAccessToken();
    }catch(error){
      _me.events.emit('graphDataNotAvailable',
        {'uri':uri,message:sys.inspect(error)});
      return;
    }
    myuri = ""+uri;
    if(myuri.indexOf("?") == -1){ myuri += "?"; };
    myuri += '&access_token='+access_token;
    facebook = http.createClient(443, 'graph.facebook.com', true);
    request = facebook.request('GET', myuri, {'host': 'graph.facebook.com'});
    request.end();
    request.on('response', function (response) {
      var _body;
      _body = "";
      response.on('data', function (chunk) { _body += chunk; });
      response.on('end', function () {
        var response;
        try{
          response = JSON.parse(_body);
          _me.events.emit('graphDataAvailable',{'uri':uri,data:response});
        }catch(error){
          _me.events.emit('graphDataNotAvailable',{'uri':uri,message:sys.inspect(error)});
        }
        
      });
    });
  }
  
};

var FBUser = function(environment){
  var _me, _graph, credentials, access_token, code, data;
  _me = this;
  credentials = {};
  _graph = {};
  
  
  this.data = {};
  this.events = new events.EventEmitter();
  this.authenticated = false;
  
  this.setCode = function(code){
    credentials.code = code;
  }
  
  this.authenticate = function(req,res,next){
    var _code;
    if(_code = url.parse(req.url,true).query.code){
      _me.setCode(_code);
      _me.fetchAccessToken();
      _me.events.on('accessTokenFetched',function(){
        next();
      });
    } else {
      next();
    } 
  }
  
  this.getAccessToken = function(){
    if(!credentials.access_token){ throw "Access Token Not Available"; }
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
}

FBUser.getLoginUrl = function(environment){
  return 'https://graph.facebook.com/oauth/authorize?'+
    'client_id='+environment.facebook.app_id+
    '&redirect_uri=http://'+environment.hostname+':'+environment.port+'/fb_redirect';
    //'&scope=offline_access';
}

if (module.exports) {
  module.exports.FBInterface = FBInterface;
  module.exports.FBUser = FBUser;
}