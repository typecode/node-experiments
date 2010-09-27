if(!tc){ tc = {}; }

var environment = {
  cloudmade:{
    api_key:null
  }
}

var app = {
    Y:null,
    selector:'#app',
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
    app.user_manager = new tc.user_manager(app);
    app.header = new tc.header(app);
    app.modal = new tc.modal(app);
    app.question_panel = new tc.question_panel(app);
    app.response_panel = new tc.response_panel(app);
    app.header.render(app.selector);
    app.question_panel.render(app.selector);
    app.response_panel.render(app.selector);
    app.modal.render(app.selector);
  }
  
  app.setupevents = function(){
    console.log('app.setupevents');
    app.Y.augment(app,app.Y.EventTarget);
  }

  