var sys = require('sys'),
    mongoose = require('../../../libs/mongoose/mongoose').Mongoose;

mongoose.model('question',{
  properties: ['_id','text','representative','image','updated_at'],
  cast: {},
  indexes: [],
  setters: {},
  getters: {},
  methods: {
    save: function(fn){
      this.updated_at = new Date();
      this.__super__(fn);
    }
  },
  static: {}
});