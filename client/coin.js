var Backbone = require('backbone');

const https = require("https");
var coinUrl = "https://api.coinmarketcap.com/v1/ticker/";

const red = "#d4483c";
const green = "#00973e";

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
      console.log("hi");
      coinUrl += coinSet[pathArray[pathArray.length - 1]].toLowerCase().replace(/ /g,"-");
      coinUrl += "/";
      https.get(coinUrl, (res) => {
        let data = '';

        // A chunk of data has been recieved.
        res.on('data', (chunk) => {
          data += chunk;
          let p = JSON.parse(data);
          console.log(p[0]);

          populateViews(p[0]);
        });
      });
    }

    function populateViews(data) {
      document.getElementById('price-text').innerHTML = data.price_usd;
      document.getElementById('price-change-text').innerHTML = "(" + data.percent_change_24h + "%)";
      if (parseInt(data.percent_change_24h) < 0) {
        document.getElementById('price-change-text').style.color = red;
      } else {
        document.getElementById('price-change-text').style.color = green;
      }

      document.getElementById('market-cap-text-value').innerHTML = "$" + parseInt(data["market_cap_usd"]).toLocaleString() + "USD";
      document.getElementById('volume-text-value').innerHTML = "$" + parseInt(data['24h_volume_usd']).toLocaleString() + "USD";
      document.getElementById('circulating-supply-text-value').innerHTML = parseInt(data["total_supply"]).toLocaleString() + " " + data["symbol"];
      document.getElementById('max-supply-text-value').innerHTML = parseInt(data["max_supply"]).toLocaleString() + " " + data["symbol"];
    }

    fetchCoinData();
  }
});

$(function() {
  var coinPage = new CoinPage();
  coinPage.display();
});
