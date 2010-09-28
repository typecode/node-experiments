var sys = require('sys'),
    multipart = require('../../../libs/multipart-js/lib/multipart'),
    querystring = require('querystring'),
    Logging = require('../libs/tc.logging'),
    facebook = require('../libs/tc.facebook'),
    Controller = require('./Controller');

var logging = new Logging();

/*::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::*/

var User = function(environment){
  var _me, model;
  _me = this;
  
  this.user = function(req,res,next){
    logging.info('User.user');
    _me.json(req,res,next,
      { 'user':req.session.data.user,
        'session_id':req.session.session_id,
        'salt':environment.salt 
      }
    );
  }
  
  this.login = function(req,res,next){
    logging.info('User.login');
    res.writeHead(303,{'Location':facebook.User.getLoginUrl(environment)});
    res.end("");
  }
  
  this.register = function(req,res,next){
    logging.info('User.register');
    var reqbody, uinfo, model, newuser;
    reqbody = "";
    req.on('data',function(chunk){
      reqbody += chunk;
    })
    req.on('end',function(){
      try{
        uinfo = querystring.parse(reqbody);
        if(uinfo.email.length == 0){
          _me.ERROR(req,res,next,{'msg':'Must enter email.'});
          return false;
        }
        if(uinfo.password.length == 0){
          _me.ERROR(req,res,next,{'msg':'Must enter password.'}); 
          return false;
        }
        if(uinfo.password !== uinfo.password2){ 
          _me.ERROR(req,res,next,{'msg':'Password do not match.'}); 
          return false;
        }
        _model = global.app.db.model('user');
        newuser = new _model;
        newuser.email = uinfo.email;
        newuser.passhash = uinfo.password;
        newuser.save(function(){
          logging.info('NewUser.register-->SAVED');
          global.app.events.emit('User:usersaved',newuser);
          _me.OK(req,res,next);
        });
      }catch(error){
        logging.info(error);
      }
      
    });
  }
  
  this.authenticate = function(req,res,next){
    logging.info('User.authenticate');
    if(!req.session.data.user){
      req.session.data.user = new facebook.User(environment);
    }
    req.session.data.user.authenticate(req,res,next);
  }
}

User.prototype = new Controller();

if (module.exports) {
  module.exports.User = User;
}


/*::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::*/


var FBUser = new function(environment){
   var _me, model;
  _me = this;
  
  this.user = function(req,res,next){
    logging.info('FBUser.user');
    _me.json(req,res,next,
      {'user':req.session.data.user,'session_id':req.session.session_id});
  }

  this.login = function(req,res,next){
    logging.info('FBUser.login');
    res.writeHead(303,{'Location':facebook.User.getLoginUrl(environment)});
    res.end("");
  }

  this.authenticate = function(req,res,next){
    logging.info('FBUser.authenticate');
    if(!req.session.data.user){
      req.session.data.user = new facebook.User(environment);
    }
    req.session.data.user.authenticate(req,res,next);
  }
  
  this.freinds = function(req,res,next){
    logging.info('FBUser.freinds');
    var _buffer, freindAvailable;
    if(!req.session.data.user.p.freindsFetcher){
      req.session.data.user.p.freindsFetcher = 
        new facebook.FreindsFetcher(req.session.data.user);
    }
    buffer = [];
    freindAvailable = function(d){
      buffer.push(d);
      if(buffer.length >= 1){
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify(buffer));
        req.session.data.user.p.freindsFetcher.events
          .removeListener('freindAvailable',freindAvailable);
      }
    }
    
    req.session.data.user.p
      .freindsFetcher.events.on('freindAvailable',freindAvailable)
  }
}