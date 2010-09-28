if(!tc){ var tc = {}; }

(function(tc){
  tc.response_panel = function(app){
   var _me, _domRef, newanswersreq;
   _me = this;
 
   this.templates = {
     base:"<div id='response_panel'>"+
        "<ul id='response_list'></ul>"+
      "</div>",
     answer:"<li><pre>{{text}} at {{updated_at}}</li>",
     loader:"<li class='loader'>"+
        "<img src='images/loader_ffffff_000000_24.gif'></img>"+
      "</li>"
   }
 
   this.initialize = function(){
     console.log('response_panel.initialize');
     app.Y.augment(_me, app.Y.EventTarget, null, null, {});
     app.on('question_panel:questionselected',_me.questionselectedHandler);
     app.on('response_panel:answersloaded',_me.answersloadedhandler);
     return _me;
   }
 
   this.render = function(selector){
     console.log('response_panel.appendTo');
     if(!selector){ selector = app.selector; }
     app.Y.one(selector).append(_me.templates.base);
     _domRef = app.Y.one("#response_panel");
   }
 
   this.questionselectedHandler = function(e){
     console.log('response_panel.questionselectedHandler');
     _domRef.one('ul').setContent(_me.loader);
     _me.getanswers(e.question_id);
   }
 
   this.getanswers = function(qid){
     console.log('response_panel.getanswers');
     if(newanswersreq){ newanswersreq.abort(); newanswersreq = null; }
     app.Y.io('/question/'+qid+"/answers",
      {on:{
        success:function(transactionId, response, arguments){
          try{
            app.fire('response_panel:answersloaded',
              app.Y.JSON.parse(response.responseText));
            _me.watchfornewanswers(qid);
          }catch(error){
            console.log(error);
          }
        }
      }}
    );
   }
 
   this.answersloadedhandler = function(array){
     console.log('response_panel.answersloadedhandler');
     var _out;
     _out = "";
     for(var i in array){
       _out += Mustache.to_html(_me.templates.answer,app.Y.JSON.parse(array[i]));
     }
     _domRef.one('ul').setContent(_out);
   
   }
 
   this.watchfornewanswers = function(qid){
     newanswersreq = app.Y.io('/question/'+qid+"/answers/new",
      {on:{
        success:function(transactionId, response, arguments){
          try{
            var _answer = app.Y.JSON.parse(app.Y.JSON.parse(response.responseText));
            _domRef.one('ul').prepend(Mustache.to_html(_me.templates.answer,_answer));
            _me.watchfornewanswers(qid);
          }catch(error){
            console.log(error);
          }
        }
      }}
    );
   }

   return this.initialize();
  }
})(tc);