if(!tc){ var tc = {}; }

(function(tc){
  tc.user_manager = function(app){
    var _me;
    _me = this;
    
    this.templates = {
      login:"<div id='login' class='modal-form'></div><div id='social_auth'></div>",
      register:"<div id='register' class='modal-form'></div><div id='social_auth'></div>"
    }
    
    this.initialize = function(){
      console.log('user_manager.initialize');
      app.Y.augment(_me, app.Y.EventTarget, null, null, {});
      this.setup_events();
      return _me;
    }
    
    this.setup_events = function(){
      console.log('user_manager.setup_events');
      app.on('header:loginButtonClicked',_me.loginButtonClickedHandler)
      app.on('header:registerButtonClicked',_me.registerButtonClickedHandler)
    }
    
    this.fetch_user = function(){
      console.log('user_manager.fetch_user');
      app.Y.io('/user',
      {on:{
        success:function(transactionId, response, arguments){
          try{
            var _json = app.Y.JSON.parse(response.responseText);
            console.log(_json);
            if(_json.salt){ app.salt = _json.salt; }
            app.fire('user_manager:user_fetched',_json);
          }catch(error){
            console.log(error);
          }
        }
      }}
    );
    }
    
    this.logged_in = function(){
      console.log('user_manager.logged_in');
      return false;
    }
    
    this.show_login_form = function(){
      console.log('user_manager.show_login_form');
      app.modal.setStdModContent('body','FORM');
    }
    
    this.loginButtonClickedHandler = function(){
      console.log('user_manager.loginButtonClickedHandler');
      var loginform;
      loginform = new app.Y.Form({
        method : "post",
        action : "/user/login",
        encodingType : app.Y.Form.URL_ENCODED,
        inlineValidation : true,
        fields : [
          {name : 'username', type : 'text', label : 'Username'},
          {name : 'password', type : 'text', label : 'Password'},
          {type : 'submit', label : 'Submit'},
          {type : 'reset', label : 'Reset'}
        ]
      });
      loginform.subscribe('success', function (args) {
        console.log('user_manager.registerButtonClickedHandler[success]');
      });
      loginform.subscribe('failure', function (args) {
        console.log('user_manager.registerButtonClickedHandler[failure]');
      });
      app.modal.once('modal:modalClosed',function(e){
        loginform.destroy();
      })
      app.modal.show("Login",_me.templates.login);
      loginform.render('#login');
    }
    
    this.registerButtonClickedHandler = function(){
      console.log('user_manager.registerButtonClickedHandler');
      var registerform;
      registerform = new app.Y.Form({
        method : "post",
        action : "/user/register",
        encodingType : app.Y.Form.URL_ENCODED,
        inlineValidation : true,
        fields : [
          {name : 'email', type : 'text', label : 'Email', validator:'email'},
          {name : 'password', type : 'text', label : 'Password'},
          {name : 'password2', type : 'text', label : 'Password Again'},
          {type : 'submit', label : 'Submit'},
          {type : 'reset', label : 'Reset'}
        ]
      });
      registerform.subscribe('success', function (args) {
        console.log('user_manager.registerButtonClickedHandler[success]');
      });
      registerform.subscribe('failure', function (args) {
        console.log('user_manager.registerButtonClickedHandler[failure]');
      });
      app.modal.once('modal:modalClosed',function(e){
        registerform.destroy();
      });
      app.modal.show("Register",_me.templates.register);
      registerform.render('#register');
    }
    
    return this.initialize();
  }
})(tc);