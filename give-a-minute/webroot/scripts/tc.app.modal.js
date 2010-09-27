if(!tc){ var tc = {}; }

(function(tc){
  tc.modal = function(app){
    var _me, _domRef, _widget;
    _me = this;
    
    this.templates = {
      header: "<a href='#' class='close'>CLOSE</a>"
    }
    
    this.initialize = function(){
      _widget = new app.Y.Overlay({ id:'modal', width:500, x: window.outerWidth/2-250, y: 100 });
      return _me;
    }
    
    this.render = function(selector){
      console.log('modal.appendTo');
      if(!selector){ selector = app.selector; }
      _widget.setStdModContent('header',_me.templates.header);
      _widget.render(selector).hide();
      _domRef = app.Y.one('#modal');
      _domRef.one('a.close').on('click',_me.hide);
    }
    
    this.hide = function(){
      console.log('modal.hide');
      _widget.hide();
    }
    
    this.show = function(content){
      console.log('modal.show');
      _widget.setStdModContent('body',content);
      _widget.show();
    }
    
    return this.initialize();
  }
})(tc);