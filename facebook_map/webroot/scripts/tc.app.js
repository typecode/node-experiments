
var environment = {
  cloudmade:{
    api_key:'1a1b06b230af4efdbb989ea99e9841af'
  }
}

var app = {
    Y:null,
    name:'facebook_map',
    version:0.1,
    openPolls:{},
    user:null,
  }
  
  app.initialize = function(Y){
    console.log('app.initialize');
    app.Y = Y;
    app.Y.Node.one('title').setContent(app.name+" - "+app.version);
    app.setupevents();
    app.user();
    
  }
  
  app.setupevents = function(){
    console.log('app.setupevents');
    app.Y.augment(app,app.Y.EventTarget);
    app.on('app:userloaded',app.userloaded);
    app.on('app:freindloaded',app.freindloaded);
  }
  
  app.user = function(){
    console.log('app.user');
    app.Y.io('/user',
      {on:{
        success:function(transactionId, response, arguments){
          try{
            var _json = app.Y.JSON.parse(response.responseText);
            if(_json.session_id){
              document.cookie = "tcsession="+_json.session_id+"; path=/";
            }
            if(!_json.user){
              window.location = '/user/login';
            } else {
              app.user = _json.user;
              app.fire('app:userloaded');
            }
          }catch(error){
            console.log(error);
          }
        }
      }}
    );
  }
  
  app.userloaded = function(){
    //app.map = new appmap('app');
    app.getFreindsData();
  }
  
  app.getFreindsData = function(){
    app.Y.io('/user/freinds',
      {on:{
        success:function(transactionId, response, arguments){
          try{
            var _json = app.Y.JSON.parse(response.responseText);
            app.fire('app:freindloaded',_json);
            app.getFreindsData();
          }catch(error){
            console.log(error);
          }
        }
      }}
    );
  }
  
  app.freindloaded = function(data){
    console.log('app.freindloaded');
    if(!app.Y.Node.one('pre')){
      app.Y.Node.one('#app').append(app.Y.Node.create("<pre></pre>"));
    }
    for(var i in data){
      if(data[i].data.about){
        app.Y.Node.one('pre').append(data[i].data.about+" ");
      }
    }
    
    
    console.log(data);
  }
