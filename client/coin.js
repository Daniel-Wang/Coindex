var Backbone = require('backbone');

const https = require("https");
var coinUrl = "https://api.coinmarketcap.com/v1/ticker/";

const red = "#d4483c";
const green = "#00973e";

selectedCurrency = "USD";

const coinSet = {
  'btc': "Bitcoin",
  'eth': "Ethereum",
  'bch': "Bitcoin Cash",
  'xrp': "Ripple",
  'ltc': "Litecoin",
  'etc': "Ethereum Classic",
  'dash': "Dash",
  'xmr': "Monero",
  'zec': "Zcash"
};

var pathArray = window.location.pathname.split( '/' );

var CoinPage = Backbone.View.extend({
  display: function(){

    function fetchCoinData() {
      if (selectedCurrency == "USD") {
        coinUrl += coinSet[pathArray[pathArray.length - 1]].toLowerCase().replace(/ /g,"-");
        coinUrl += "/";

      } else {
        coinUrl += coinSet[pathArray[pathArray.length - 1]].toLowerCase().replace(/ /g,"-");
        coinUrl += "?convert=" + selectedCurrency;
      }
      https.get(coinUrl, (res) => {
        let data = '';

        // A chunk of data has been recieved.
        res.on('data', (chunk) => {
          data += chunk;
          let p = JSON.parse(data);
          console.log(p[0]);

          populateViews(p[0]);
          coinUrl = "https://api.coinmarketcap.com/v1/ticker/";
        });
      });
    }

    function populateViews(data) {
      selectedCurrency = selectedCurrency.toLowerCase();
      document.getElementById('price-text').innerHTML = data["price_" + selectedCurrency];
      document.getElementById('price-change-text').innerHTML = "(" + data.percent_change_24h + "%)";
      if (parseInt(data.percent_change_24h) < 0) {
        document.getElementById('price-change-text').style.color = red;
      } else {
        document.getElementById('price-change-text').style.color = green;
      }
      document.getElementById('currency-text').innerHTML = selectedCurrency.toUpperCase();
      document.getElementById('market-cap-text-value').innerHTML = parseInt(data["market_cap_" + selectedCurrency]).toLocaleString() + " " + selectedCurrency.toUpperCase();
      document.getElementById('volume-text-value').innerHTML = parseInt(data['24h_volume_' + selectedCurrency]).toLocaleString() + " " + selectedCurrency.toUpperCase();
      document.getElementById('circulating-supply-text-value').innerHTML = parseInt(data["total_supply"]).toLocaleString() + " " + data["symbol"];
      document.getElementById('max-supply-text-value').innerHTML = parseInt(data["max_supply"]).toLocaleString() + " " + data["symbol"];
    }

    var select = document.getElementById('currency-list');

    function onSelectChanged() {
      console.log("fetching " + selectedCurrency);
      fetchCoinData();
    }

    if (select.addEventListener) {
      select.addEventListener('change', onSelectChanged, false);
    } else {
      select.attachEvent('onchange', onSelectChanged, false);
    }

    fetchCoinData();
  }
});

$(function() {
  var coinPage = new CoinPage();
  coinPage.display();
});
