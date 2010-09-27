var sys = require('sys'),
    mongoose = require('../../../libs/mongoose/mongoose').Mongoose;

mongoose.model('answer',{
  properties: ['_id','text','question_id','updated_at'],
  cast: {
    text: String,
    representative: String,
    image: String
  },
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