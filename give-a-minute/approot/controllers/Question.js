var sys = require('sys'),
    Logging = require('../libs/tc.logging'),
    Controller = require('./Controller'),
    answer = require('../models/answer');

var logging = new Logging();

var Question = function(){
  var _me, model;
  _me = this;
  
  this.model = function(){
    if(model){
      return model;
    } else {
      model = global.app.db.model('question');
      return model;
    }
  }
  
  this.all = function(req,res,next){
    logging.info('Question.all');
    _me.model().find().all(function(array){
      _me.json(req,res,next,array);  
    });
  }
  
  this.create = function(req,res,next){
    logging.info('Question.create');
    var qm = new _me.model();
    var q = new qm();
    q.text = 'QUESTION QUESTION QUESTION';
    q.save(function(){
        sys.puts('Saved!');
    });
    _me.all(req,res,next);
  }
  
  this.answer = function(req,res,next){
    logging.info('Question.answer');
    var reqbody, _json, _model, _answer;
    reqbody = "";
    req.on('data',function(chunk){
      reqbody += chunk;
    })
    req.on('end',function(){
      try{
        _json = JSON.parse(reqbody);
        _model = global.app.db.model('answer');
        _answer = new _model;
        _answer.question_id = _json.question_id;
        _answer.text = _json.text;
        _answer.save(function(){
          logging.info('Question.answer-->SAVED');
          global.app.events.emit('Question:answersaved',_answer);
          _me.OK(req,res,next);
        });
      }catch(error){
        logging.info(error);
      }
    });
  }
  
  this.answers = function(req,res,next){
    logging.info('Question.answers');
    var _myqid;
    _myqid = /\/[a-zA-Z0-9]*(?=\/answers)/.exec(req.url)[0];
    _myqid = _myqid.substring(1,_myqid.length);
    global.app.db.model('answer').find({question_id:_myqid}).all(function(arr){
      arr.sort(function(a,b){
        return (a.updated_at >= b.updated_at) ? -1 : 1;
      });
      _me.json(req,res,next,arr);
    });
  }
  
  this.answerspoll = function(req,res,next){
    logging.info('Question.answerspoll');
    _myqid = /\/[a-zA-Z0-9]*(?=\/answers)/.exec(req.url)[0];
    _myqid = _myqid.substring(1,_myqid.length);
    global.app.events.on('Question:answersaved',function(_answer){
      if(_answer.question_id == _myqid){
        _me.json(req,res,next,_answer);
      }
    })
  }
}

Question.prototype = new Controller();

if (module.exports) {
  module.exports = Question;
}