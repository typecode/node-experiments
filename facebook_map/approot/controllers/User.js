var sys = require('sys'),
    Logging = require('../libs/tc.logging'),
    facebook = require('../libs/tc.facebook'),
    Controller = require('./Controller');

var logging = new Logging();
var User = function(environment){
  
  this.user = function(req,res,next){
    logging.info('User.user');
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify(
      {'user':req.session.data.user,'session_id':req.session.session_id}));
  }

  this.login = function(req,res,next){
    logging.info('User.login');
    res.writeHead(303,{'Location':facebook.User.getLoginUrl(environment)});
    res.end("");
  }

  this.authenticate = function(req,res,next){
    logging.info('User.authenticate');
    if(!req.session.data.user){
      req.session.data.user = new facebook.User(environment);
    }
    req.session.data.user.authenticate(req,res,next);
  }
  
  this.freinds = function(req,res,next){
    logging.info('User.freinds');
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

  this.graphData = function(req,res,next){
    logging.info('User.graphData');
    var fbi;
    fbi = new facebook.Interface(req.session.data.user,environment);
    fbi.events.on('graphDataAvailable',function(d){
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify(d));
    });
    fbi.events.on('graphDataNotAvailable',function(d){
      res.writeHead(500,{'Content-Type':'application/json'});
      res.end(JSON.stringify({message:'Data not available.',status:500}));
    });
    fbi.fetchGraphData(req.url.replace('/user/graph',''));
  }
  
}

User.prototype = new Controller();

if (module.exports) {
  module.exports = User;
}