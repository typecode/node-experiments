var sys = require('sys');

var Logging = function(){
  
  this.dump = function(obj){
    console.log(sys.inspect(obj));
  }
  
  this.info = function(msg){
    console.log(msg);
  }
}

if (module.exports) {
  module.exports = Logging;
}