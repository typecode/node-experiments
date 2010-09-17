var sys = require('sys'),
    utils = require('../libs/tc.utils');

var SessionManager = function(){
  var _sessions, howmany;
  _sessions = {}; howmany = 0;
  
  this.getSession = function(req,res,next){
    //console.log('SessionManager.getSession: '+req.session_id);
    if(!req.session_id){
      req.session_id = utils.randomStr(32);
    }
    
    if(!_sessions[req.session_id]){
      _sessions[req.session_id] = {
        created:new Date().getTime(),
        session_id:req.session_id,
        data:{}
      };
      howmany = howmany + 1;
    }
    
    req.session = _sessions[req.session_id];
    next();
  }
  
}

if (module.exports) {
  module.exports = SessionManager;
}