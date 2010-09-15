var sys = require('sys');

var SessionManager = function(){
  
  var _sessions;
  _sessions = {};
  
  this.getSession = function(session_key){
    if(!_sessions[session_key]){
      _sessions[session_key] = {};
    }
    return _sessions[session_key];
  }
  
}

if (module.exports) {
  module.exports = SessionManager;
}