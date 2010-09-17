var sys = require('sys');

var SessionManager = function(){
  var _sessions, howmany;
  _sessions = {}; howmany = 0;
  
  this.getSession = function(session_key){
    if(!_sessions[session_key]){
      _sessions[session_key] = {created:new Date().getTime(),data:{}};
      howmany = howmany + 1;
    }
    return _sessions[session_key].data;
  }
  
}

if (module.exports) {
  module.exports = SessionManager;
}