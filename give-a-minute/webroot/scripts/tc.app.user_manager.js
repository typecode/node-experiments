if(!tc){ var tc = {}; }

(function(tc){
  tc.user_manager = function(app){
    var _me;
    _me = this;
    
    this.templates = {
      login: new app.Y.Node.create("<div></div>"),
      register:"REGISTER FORM"
    }
    
    this.myforms = {
      login: new app.Y.Form({
        action : '',
        method : 'post',
        children : [
          {name : "username", required : true, label : "Username"},
          {name : "password", required : true, label : "Password"},
          {name : 'submit', type : 'SubmitButton', value : 'Submit'}
        ]
      })
    }
    
    this.initialize = function(){
      console.log('user_manager.initialize');
      this.setup_events();
      this.myforms.login.render();
      return _me;
    }
    
    this.setup_events = function(){
      console.log('user_manager.setup_events');
      app.on('header:loginButtonClicked',_me.loginButtonClickedHandler)
      app.on('header:registerButtonClicked',_me.registerButtonClickedHandler)
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
      app.modal.show(app.Y.Node.getDOMNode(_me.templates.login));
    }
    
    this.registerButtonClickedHandler = function(){
      console.log('user_manager.registerButtonClickedHandler');
      app.modal.show(_me.templates.register);
    }
    
    return this.initialize();
  }
})(tc);