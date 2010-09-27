
var question_panel = function(app){
 var _me, _domRef;
 _me = this;
 
 this.template =  "<div id='question_panel'>"+
                    "<form id='response_form' action=''>"+
                      "<select id='question_select' name='question_id'></select>"+
                      "<textarea name='answer'></textarea>"+
                      "<a href='#' class='button' id='response-submit-button'>Submit</a>"+
                    "</form>"+
                    "<div class='clear'></div>"+
                  "</div>";
 
 this.initialize = function(){
   console.log('question_panel.initialize');
   _me.getquestions();
   app.on('question_panel:questionsloaded',_me.populate);
   return _me;
 }
 
 this.getquestions = function(question_id){
  console.log('question_panel.getquestions');
  app.Y.io('/question/all',
    {on:{
      success:function(transactionId, response, arguments){
        try{
          var _json = app.Y.JSON.parse(response.responseText);
          app.fire('question_panel:questionsloaded',_json);
        }catch(error){
          console.log(error);
        }
      }
    }}
  );
 }
 
 this.appendTo = function(selector){
   console.log('question_panel.appendTo');
   app.Y.one(selector).append(_me.template);
   _domRef = app.Y.one("#question_panel");
   _domRef.one('#question_select')
    .on('change',_me.questionSelectChangeHandler);
   _domRef.one('#response-submit-button')
    .on('click',_me.responseSubmitButtonClickHandler);
  _domRef.one('textarea').on('keypress',_me.textareakeypresshandler)
 }
 
 this.populate = function(json){
   console.log('question_panel.populate');
   var _json, _options, _myDomRef;
   if(!_domRef){ return false; }
   _myDomRef = _domRef.one('#question_select');
   _options = "";
   for(var i in json){
     try{
       _json = app.Y.JSON.parse(json[i]);
       if(i == 0){
         _options += '<option value="'+_json._id+'" selected="true">'+_json.text+'</option>';
       } else {
         _options += '<option value="'+_json._id+'">'+_json.text+'</option>'; 
       }
     }catch(error){
       console.log(error);
     }
   }
   _myDomRef.append(_options);
   _myDomRef.simulate('change');
 }
 
 this.questionSelectChangeHandler = function(e){
   console.log('question_panel.questionSelectChangeHandler');
   e.target.get("options").each(function(){
     var selected, value, text;
     if(this.get('selected')){
       e.target.setAttribute('value',this.get('value'));
       app.fire('question_panel:questionselected',
        {question_id:this.get('value')});
     }
  });
 }
 
 this.responseSubmitButtonClickHandler = function(e){
   console.log('question_panel.responseSubmitButtonClickHandler');
   var _data;
   _data = {
     question_id: _domRef.one('select').getAttribute('value'),
     text: _domRef.one('textarea')._node.value
   }
   if(!_data.text.length){ return false; }
   app.Y.io('/question/answer',
      { method:"POST",
        data:app.Y.JSON.stringify(_data),
        on:{
        success:function(transactionId, response, arguments){
          try{
            _domRef.one('textarea')._node.value = "";
            var _json = app.Y.JSON.parse(response.responseText);
            app.fire('question_panel:answersubmitted',_json);
          }catch(error){
            console.log(error);
          }
        }
      }}
    );
 }
 
 this.textareakeypresshandler = function(e){
   if(e.keycode == 13){
    
   }
 }
 
 return this.initialize();
}