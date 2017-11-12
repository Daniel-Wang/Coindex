var Backbone = require('backbone');
var blockstack = require('blockstack');

var STORAGE_FILE = 'coindex.json';

var CoinPage = Backbone.View.extend({
  display: function(){
    
  }
});

$(function() {
  var coinPage = new CoinPage();
  coinPage.display();
});
