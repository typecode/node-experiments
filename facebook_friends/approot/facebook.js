var http = require('http'),
  sys = require('sys'),
  events = require('events'),
  url = require('url'),
  utils = require('./libs/utils');

var FBInterface = function(app_id,app_secret){
  var _me, conf, user;
  _me = this;
  this.client = http.createClient(443,'graph.facebook.com',true);
  conf = {
    app_id:app_id,
    app_secret:app_secret
  }
  
  this.auth = function(req,res,next){
    if(!user){
      user = new FBUser(conf);
    }
    user.handleAuthentication(url.parse(req.url,true).query);
    next();
  }
  
};

var FBUser = function(conf){
  var credentials, conf, httpRequest;
  conf = conf;
  
  this.log_out = function(){
    credentials = null;
    this.logged_in = false;
  }
  
  this.handleAuthentication = function(args){
    console.log(sys.inspect(args));
    if(args.code){
      (function(_args){
        var _uri = '/oauth/access_token?client_id='+conf.app_id+
        '&redirect_uri=http://localhost:8123/fb_redirect'+
        '&client_secret='+conf.app_secret+'&code='+_args.code;
        console.log(_uri);
        var _client = http.createClient(443,'graph.facebook.com',true);
        var _request = _client.request('GET', _uri, {'User-Agent':'Mozilla/5.0 (Linux; X11)'});
        _request.end();
        _request.on('response',function(res){
          res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
          });
        })
      })(args);
    }else if(args.access_token){
      this.access_token = args.access_token;
      console.log(this.access_token);
    }
  }
  
}

if (module.exports) {
  module.exports = FBInterface;
}