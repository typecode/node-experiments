var app = {
    YUI:null,
    name:'facebook_friends',
    version:0.1,
    openPolls:{},
    events:{},
    user:null
  }
  
  app.initialize = function(Y){
    console.log('app.initialize');
    app.YUI = Y;
    app.setupevents();
    app.getuser();
  }
  
  app.setupevents = function(){
    console.log('app.setupevents');
    app.YUI.augment(app.events,app.YUI.EventTarget);
    app.events.on('app:graphdatareceived',app.graphDataReceived);
  }
  
  app.getuser = function(){
    console.log('app.getuser');
    app.YUI.io('/user',
      {on:{
        success:function(transactionId, response, arguments){
          try{
            var _json = app.YUI.JSON.parse(response.responseText);
            if(_json.redirect){
              window.location = _json.redirect;
            } else if(_json.user){
              app.user = _json.user;
              app.getgraphdata('/me/friends');
            }
          }catch(error){
            console.log(error);
          }
        }
      }}
    );
  }
  
  app.getgraphdata = function(uri){
    console.log('app.getgraphdata');
    if(!uri){
      return;
    }
    app.YUI.io('/user/graph'+uri,
      {on:{
        success:function(transactionId, response, arguments){
          try{
            var _json = app.YUI.JSON.parse(response.responseText);
            app.events.fire('app:graphdatareceived',_json)
          }catch(error){
            console.log(error);
          }
        }
      }}
    );
  }
  
  app.graphDataReceived = function(json){
    console.log('app.graphDataReceived');
    switch(json.uri){
      case '/me/friends':
        app.renderuserfriends(json);
        break;
    }
  }
  
  app.renderuserfriends = function(json){
    console.log('app.renderuserfriends');
    var imgbuffer, renderinterval;
    imgbuffer = [];
    json.data.data.forEach(function(i){
      var imgpath, imgalt;
      imgpath = "http://graph.facebook.com/"+i.id+"/picture?type=square";
      imgalt = i.name;
      imgbuffer.push("<img alt='"+imgalt+"' src='"+imgpath+"'></img>");
    });
    renderinterval = setInterval(function(){
      if(!imgbuffer.length){ clearInterval(renderinterval); return; }
      app.YUI.one("#fb_content")
        .append(imgbuffer.shift());
    }, 50);
    
  }