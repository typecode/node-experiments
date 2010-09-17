var http = require('http'),
    sys = require('sys'),
    events = require('events'),
    url = require('url'),
    utils = require('./tc.utils');
    Logging = require('./tc.logging');
var logging = new Logging();

var Interface = function(user){
  var _me;
  _me = this;
  
  this.events = new events.EventEmitter();

  this.fetchGraphData = function(uri){
    logging.info('facebook.Interface.fetchGraphData');
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

var User = function(environment){
  var _me, _graph, credentials, access_token, data;
  _me = this;
  _graph = {};
  
  this.p = {};
  this.data = {};
  this.events = new events.EventEmitter();
  this.authenticated = false;
  
  this.authenticate = function(req,res,next){
    logging.info('facebook.User.authenticate');
    var code;
    if(code = url.parse(req.url,true).query.code){
      fetchAccessToken(code);
      _me.events.on('accessTokenFetched',function(){
        logging.info('facebook.User.authenticate[accessTokenFetched]');
        _me.fetchUserDetails(req,res,next);
      });
    } else {
      res.writeHead(500,{'Content-Type':'application/json'});
      res.end(JSON.stringify({message:'Authentication Failed.',status:500}));
    } 
  }
  
  this.fetchUserDetails = function(req,res,next){
    logging.info('facebook.User.fetchUserDetails');
    var fbi;
    fbi = new Interface(_me,environment);
    fbi.events.on('graphDataAvailable',function(d){
      logging.info('facebook.User.fetchUserDetails[graphDataAvailable]');
      req.session.data.user.data[d.uri] = d.data
      res.writeHead(303,{'Location':'/'});
      res.end("");
    });
    fbi.events.on('graphDataNotAvailable',function(d){
      logging.info('facebook.User.fetchUserDetails[graphDataNotAvailable]');
      res.writeHead(500,{'Content-Type':'application/json'});
      res.end(JSON.stringify({message:'Authentication Failed.',status:500}));
    });
    fbi.fetchGraphData('/me');
  }
  
  this.getAccessToken = function(){
    if(!access_token){ throw "Access Token Not Available"; }
    return access_token;
  }
  this.setAccessToken = function(new_access_token){
    access_token = new_access_token;
  }
  
  function fetchAccessToken(code){
    logging.info('facebook.User->fetchAccessToken');
    var facebook = http.createClient(80, 'graph.facebook.com');
    var request = facebook.request('GET', '/oauth/access_token?'+
      'client_id='+environment.facebook.app_id+'&'+
      'redirect_uri=http://'+environment.hostname+':'+environment.port+'/fb_redirect&'+
      'client_secret='+environment.facebook.app_secret+'&'+
      'code='+code,
      {'host': 'graph.facebook.com'});
    request.end();
    request.on('response', function (response) {
      var _body = "";
      response.on('data', function (chunk) {
        _body += chunk;
      });
      response.on('end', function () {
        if(_body.indexOf('&') != -1){
          access_token = _body
            .substring(_body.indexOf('=')+1,_body.indexOf('&'));
        } else {
          access_token = _body.substring(_body.indexOf('=')+1,_body.length);
        }
        _me.authenticated = true;
        _me.events.emit('accessTokenFetched');
      });
    });
  }
  
}

var FreindsFetcher = function(user){
  logging.info('facebook.FreindsFetcher');
  var _me, freindrequests;
  _me = this;
  this.events = new events.EventEmitter();
  this.buffer = [];
  
  (function(){
    var fbi;
    fbi = new Interface(user);
    fbi.events.on('graphDataAvailable',function(d){
      logging.info('facebook.FreindsFetcher.f[graphDataAvailable]');
      _me.events.emit('freindsListReceived',d)
    });
    fbi.events.on('graphDataNotAvailable',function(d){
      logging.info('facebook.FreindsFetcher.f[graphDataNotAvailable]');
    });
    fbi.fetchGraphData('/me/friends');
  })();
  
  freindrequests = [];
  
  this.events.on('freindsListReceived',function(d){
    logging.info('facebook.FreindsFetcher[freindsListReceived]');
    d.data.data.forEach(function(i){
      freindrequests.push(function(){
        var fbi;
        fbi = new Interface(user);
        fbi.events.on('graphDataAvailable',function(d){
          logging.info('facebook.FreindsFetcher\
[freindsListReceived][graphDataAvailable]');
          _me.events.emit('freindAvailable',d)
        });
        fbi.events.on('graphDataNotAvailable',function(d){
          logging.info('facebook.FreindsFetcher\
[freindsListReceived][graphDataNotAvailable]');
        });
        fbi.fetchGraphData('/'+i.id);
      })
    });
    
    freindrequests.shift()();
  });
  
  this.events.on('freindAvailable',function(d){
    logging.info('facebook.FreindsFetcher[freindAvailable]');
    freindrequests.shift()();
    if(!user.data.freinds){ user.data.freinds = []; }
    user.data.freinds.push(d);
  })
  
  return this;
}

User.getLoginUrl = function(environment){
  logging.info('facebook.User::fetchAccessToken');
  return 'https://graph.facebook.com/oauth/authorize?'+
    'client_id='+environment.facebook.app_id+
    '&redirect_uri='+
      'http://'+environment.hostname+':'+environment.port+'/fb_redirect';
    //'&scope=offline_access';
}

if (module.exports) {
  module.exports.Interface = Interface;
  module.exports.User = User;
  module.exports.FreindsFetcher = FreindsFetcher;
}