var http = require('http'),
  sys = require('sys'),
  events = require('events'),
  base64 = require('./libs/base64');


exports.fetcher = function(){
  var _me = this;
  this.events = new events.EventEmitter;
  this.conf = null;
  this.client = http.createClient(443,'mail.google.com',true);
  
  this.initialize = function(conf){
    //console.log('gmail.fetcher.initialize');
    this.conf = conf;
    setInterval(this.fetch, this.conf.freq);
    this.fetch();
  }
  
  this.fetch = function(){
    //console.log('gmail.fetcher.fetch');
    var _headers = {}
    _headers['host'] = 'mail.google.com';
    _headers['Authorization'] = 'Basic '+base64.btoa(_me.conf.un+':'+_me.conf.pw);
    var _request = _me.client.request('GET', '/mail/feed/atom', _headers);
    _request.end();
    _request.on('response',_me.receiver);
  }
  
  this.receiver = function(response){
    //console.log('gmail.fetcher.receiver');
    response.setEncoding('utf8');
    var _body = ""
    response.on('data', function (chunk) {
      //console.log('gmail.fetcher.receiver.data');
      _body = _body + chunk;
    });
    response.on('end', function () {
      //console.log('gmail.fetcher.receiver.end');
      _me.events.emit('gmailReceived',_body);
    });
  }
  
};
