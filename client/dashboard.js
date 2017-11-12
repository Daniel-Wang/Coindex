var Backbone = require('backbone');
var blockstack = require('blockstack');

const https = require("https");

var STORAGE_FILE = 'coindex2.json';

const ETH = "eth";
const BTC = "btc";
const LTC = "ltc";
const ethScanApiKey = "1W56HIJ9HQDWG3WRRTBANU3K7X3TB96P8Y";

var DashboardPage = Backbone.View.extend({
  display: function(){

    function closeDialog() {
      $('.overlay').hide();
      $('.dialog').toggle();
      $('#choose-add-type-dialog').show();
      $('#address-add-dialog').hide();
      $('#manual-add-dialog').hide();
    }

    $('.overlay').on('click', function(){
      closeDialog();
    });

    var portfolio = {
      "wallets": [],
      "totalUSD": 0
    };
    var wallets;
    var transactions = [];
    var selectedType = BTC; // By default
    var newAddress = "";

    $('#addDialog-button').click(function(event) {
      $('#addDialog').toggle();
      $('.overlay').toggle();
    });

    $('#address-dialog-button').click(function(event) {
      $('#choose-add-type-dialog').toggle();
      $('#address-add-dialog').toggle();
    });

    $('#manual-dialog-button').click(function(event) {
      $('#choose-add-type-dialog').toggle();
      $('#manual-add-dialog').toggle();
      document.getElementById('addDialog').style.height = "600px";
    });

    $('#btc-button').click(function(event) {
      document.getElementById('btc-button').classList.add('currency-button-selected');
      document.getElementById('eth-button').classList.remove('currency-button-selected');
      selectedType = BTC; 
    });

    $('#eth-button').click(function(event) {
      document.getElementById('eth-button').classList.add('currency-button-selected');
      document.getElementById('btc-button').classList.remove('currency-button-selected');
      selectedType = ETH;
    });

    $('#wallet-address').on('keyup', function(event) {
      newAddress = document.getElementById('wallet-address').value.trim();
      document.getElementById('already-exists-error').display = 'none';
      
      if (newAddress.length > 0) {
        document.getElementById('add-wallet-button').disabled = false;
      } else {
        document.getElementById('add-wallet-button').disabled = true;
      }
    });

    $('#add-wallet-button').click(function(event) {
      event.preventDefault();

      var alreadyExists = false;

      var newWallet = {
        "type": selectedType,
        "address": newAddress
      };

      document.getElementById('wallet-address').value = "";

      wallets.forEach(function (wallet) {
        if (wallet.address === newAddress) {
          alreadyExists = true;
        }
      });

      if (!alreadyExists) {
        portfolio.wallets.push(newWallet);
        fetchWalletInfo(selectedType, newAddress);
        closeDialog();
      } else {
        document.getElementById('already-exists-error').display = 'inline';
      }
      
    });

    function fetchWalletInfo(type, address) {
      var walletValue = "";
      var typeName = "";
      var url = "";

      switch(type) {
        case BTC:
          url = `https://blockchain.info/q/addressbalance/${address}`;
          typeName = "bitcoin";
          https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
              data += chunk;
              var p = JSON.parse(data);
              walletValue = parseFloat(p)*Math.pow(10, -8);
              getPriceUSD(type, typeName, walletValue);
            });
          });
          break;

        case ETH:
          url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ethScanApiKey}`;
          typeName = "ethereum";
          https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
              data += chunk;
              var p = JSON.parse(data);
              walletValue = parseFloat(p.result)*Math.pow(10, -18);
              getPriceUSD(type, typeName, walletValue);
            });
          });
          break;

        case LTC:
          break;

        default:
          break;
      }
    }

    function getPriceUSD (type, typeName, walletValue) {
      var url = `https://api.coinmarketcap.com/v1/ticker/${typeName}/`;
      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
          var p = JSON.parse(data);
          var priceUSD = p[0].price_usd;
          var coinValueUSD = walletValue*parseFloat(priceUSD);

          if (portfolio.totalUSD) {
            portfolio.totalUSD += coinValueUSD;
          } else {
            portfolio.totalUSD = coinValueUSD;
          }

          var percent = Math.round(coinValueUSD*100/parseFloat(portfolio.totalUSD));
          portfolio.totalUSD = parseFloat(portfolio.totalUSD).toFixed(5);

          populatePortfolio(type, percent, walletValue, coinValueUSD);
          blockstack.putFile(STORAGE_FILE, JSON.stringify(portfolio));
        });
      });
    }

    function fetchTransactions(type, address) {
      switch(type) {
        case ETH:
          var ethTransUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ethScanApiKey}`;
          https.get(ethTransUrl, (res) => {
            let data = '';

            // A chunk of data has been recieved.
            res.on('data', (chunk) => {
              data += chunk;
              var p = JSON.parse(data);

              p.result.forEach(function(trans) {
                var date = new Date(trans.timeStamp*1000);
                date = date.toDateString().substring(4, 10);
                var singleTransaction = {
                  "date": date,
                  "from": trans.from,
                  "to": trans.to,
                  "value": parseFloat(trans.value)*Math.pow(10, -18),
                  "type": ETH
                };
                transactions.push(singleTransaction);
              });
              //TODO: Actually sort the transactions by recent date
              transactions.reverse();
              showTransactions();
            });
          });
          break;

        case BTC:

          break;

        default:
          break;
      }
    }

    function populateRecentTransactions(date, transText, transVal, transType) {
      $('[class="transaction-common"]').hide();
      $(".transaction").append(`<div class="portfolio-item"> <div class="CryptoCurrencyType"  style="flex:0.8">${date}</div> <div class="Percent-of-Portfolio" style="flex:1.2">${transText}</div> <div class="CryptoCurrencyVal" style="flex:1">${parseFloat(transVal).toFixed(5)} <span>${transType}</span></div> </div>`);
    }

    function populatePortfolio(type, portPercent, value, usdExch) {
      var typeName = "";
      switch(type) {
        case BTC:
          typeName = "Bitcoin";
          break;

        case ETH:
          typeName = "Ethereum";
          break;

        case LTC:
          typeName = "Litecoin";
          break;
      }
      $(".portfolio-item-container").append(`<div class="portfolio-item">  <div class="CryptoCurrencyType">${typeName}</div> <div class="Percent-of-Portfolio">${portPercent}%</div><div class="CryptoCurrencyVal">${value.toFixed(5)} ${type}</div><div class="USD">USD ${usdExch.toFixed(5)}</div></div>`);

      $('.portfolio-total-balance').html(`Total balance: US$${portfolio.totalUSD}`);
    }

    function showTransactions() {
      transactions.forEach(function(data){
        var transText = "";
        var transVal = "";
        var transType;

        wallets.forEach(function(wallet) {
          if (wallet.address == data.from) {
            transText = "Sent ";
            transVal = "-";
          }
        });

        if (transText.length == 0) {
          transText = "Received ";
        }
        switch(data.type) {
          case ETH:
            transText += "Ethereum";
            transType = "ETH";
            break;

          case BTC:
            transText += "Bitcoin";
            transType = "BTC";
            break;

          default:
            transText += "coins";
            transType = "COINS";
            break;
        }

        transVal += data.value;

        populateRecentTransactions(data.date, transText, transVal, transType);
      });
    }

    blockstack.getFile(STORAGE_FILE).then((portfolioJson) => {
      portfolio = JSON.parse(portfolioJson);

      if (portfolio.wallets.length == 0) {
        portfolio = {
          "wallets" : []
        };
      }

      fetchTransactions(portfolio.wallets[0].type, portfolio.wallets[0].address);
      fetchWalletInfo(portfolio.wallets[0].type, portfolio.wallets[0].address);
    });

    // // Uncomment when Daniel is testing and blockstack doesn't work
    // portfolio = {
    //   "wallets" : []
    // };

    wallets = portfolio.wallets;
  }
});

$(function() {
  var dashboardPage = new DashboardPage();
  dashboardPage.display();
});
