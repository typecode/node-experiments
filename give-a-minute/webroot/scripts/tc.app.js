
var environment = {
  cloudmade:{
    api_key:null
  }
}

var app = {
    Y:null,
    name:'give-a-minute',
    version:0.1,
    openPolls:{},
    user:null,
    question_panel:null,
    response_panel:null
  }
  
  app.initialize = function(Y){
    console.log('app.initialize');
    app.Y = Y;
    app.Y.Node.one('title').setContent(app.name+" - "+app.version);
    app.setupevents();
    app.question_panel = new question_panel(app);
    app.question_panel.appendTo('#app');
    app.response_panel = new response_panel(app);
    app.response_panel.appendTo('#app');
  }
  
  app.setupevents = function(){
    console.log('app.setupevents');
    app.Y.augment(app,app.Y.EventTarget);
  }

  