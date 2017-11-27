var Backbone = require('backbone');
var blockstack = require('blockstack');
var autobahn = require('autobahn');

var wsuri = "wss://api.poloniex.com";
var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});

var latestCoinPrices = {};

const https = require("https");

var STORAGE_FILE = 'coindex.json';

const ETH = "eth";
const BTC = "btc";
const LTC = "ltc";
const ethScanApiKey = "1W56HIJ9HQDWG3WRRTBANU3K7X3TB96P8Y";

var coinSet = {
  'btc':"Bitcoin",
  'eth':"Ethereum",
  'bch':"Bitcoin Cash",
  'xrp':"Ripple",
  'ltc':"Litecoin",
  'etc':"Ethereum Classic",
  'dash':"Dash",
  'xmr':"Monero",
  'zec':"Zcash"
};

var noDataLoadedCoinList = [];

var DashboardPage = Backbone.View.extend({
  display: function(){
    function openWebSocketConnection() {
      connection.onopen = function (session) {
        console.log("Socket opened");
        function tickerEvent(args, kwargs) {
          let ticker = args[0];

          if (ticker.substring(0, 5) === "USDT_") {
            let symbol = ticker.substring(5).toLowerCase();
            latestCoinPrices[symbol] = args[1];

            let indicesToRemove = [];
            let counter = 0;
            noDataLoadedCoinList.forEach(function (coin) {
              if (symbol == coin.type) {
                console.log("Add removal " + counter);
                indicesToRemove.push(counter);
                let priceUSD = latestCoinPrices[symbol];
                addCoinToPortfolio(symbol, coin.amount.toString(), priceUSD.toString());
              }
              counter++;
            });

            console.log("initial");
            console.log(noDataLoadedCoinList);
            console.log(indicesToRemove);
            indicesToRemove.forEach(function (index) {
              console.log("removed " + index);
              noDataLoadedCoinList.splice(index, 1);
            });
            console.log("after");
            console.log(noDataLoadedCoinList);
            console.log(indicesToRemove);

            updateTotalUSD();
            updateCoinPercentage();
            updatePortfolio();
          }
        }

        session.subscribe('ticker', tickerEvent);
      };

      connection.onclose = function () {
        console.log("Websocket connection closed");
        // alert("Websocket connection closed");
      };

      connection.open();
    }

    $('#signout-button').click(function(event) {
      event.preventDefault();
      console.log('signout')
      // blockstack.signUserOut(window.location.origin);
    });

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
      "coins": [],
      "totalUSD": 0
    };
    var wallets;
    var transactions = [];
    var selectedAddressType = BTC; // By default
    selectedManualType = BTC;
    var newAddress = "";
    var manualAmount = "";
    var manualBuyPrice = "";

    function checkEnableAddManualButton() {
      document.getElementById('add-manual-button').disabled = !(manualAmount.length > 0 && manualBuyPrice.length > 0);
    }

    function getCoinHistoricPrice(coin) {
      let sum = 0.0;
      coin.priceAt.forEach(function (priceAt) {
        sum += parseFloat(priceAt.coinAmount) * parseFloat(priceAt.coinPrice);
      });
      return sum;
    }

    function getCoinMarketValue(type, amount) {
      let marketPrice = latestCoinPrices[type];
      return parseFloat(amount) * marketPrice;
    }

    function updateCoinPercentage() {
      if (portfolio.coins.length > 0) {
        portfolio.coins.forEach(function (coin) {
          coin['percentPortfolio'] = getCoinMarketValue(coin.type, coin.amount) / parseFloat(portfolio.totalUSD) * 100.0;
        });
      }
    }

    function updateTotalUSD() {
      if (portfolio.coins.length > 0) {
        portfolio.totalUSD = 0;
        portfolio.coins.forEach(function (coin) {
          portfolio.totalUSD += getCoinMarketValue(coin.type, coin.amount);
        });
      }
    }

    function addCoinToPortfolio(coinType, coinAmount, coinPrice) {
      let alreadyExists = false;
      const newPriceAt = {
        coinPrice: coinPrice,
        coinAmount: coinAmount
      };

      const newCoin = {
        "type": coinType,
        "coinName": coinSet[coinType],
        "amount": parseFloat(coinAmount),
        "priceAt": [newPriceAt]
      };

      portfolio.coins.forEach(function (coin) {
        if (coin.type === newCoin.type) {
          alreadyExists = true;
          coin.amount += newCoin.amount;

          let thisPriceExists = false;
          coin.priceAt.forEach(function (priceAt) {
            if (priceAt.coinPrice) {
              thisPriceExists = true;
              priceAt.coinPrice += coinAmount;
            }
          });

          if (!thisPriceExists) {
            coin.priceAt.push(newPriceAt);
          }
        }
      });

      if (!alreadyExists) {
        portfolio.coins.push(newCoin);
      }
      updateTotalUSD();
      updateCoinPercentage();
      document.getElementById('currency-qty').value = "";
      document.getElementById('coin-qty').value = "";
    }

    $('#add-manual-button').click(function() {
      addCoinToPortfolio(selectedManualType, manualAmount, manualBuyPrice);
      updatePortfolio();
      // blockstack.putFile(STORAGE_FILE, JSON.stringify(portfolio));
      closeDialog();
    });

    $('#coin-qty').on('keyup', function() {
      manualAmount = document.getElementById('coin-qty').value.trim();
      document.getElementById('amount-invalid-message').display = 'none';
      if (isNaN(manualAmount)) {
        document.getElementById('coin-qty').value = "";
        document.getElementById('amount-invalid-message').display = 'inline';
      }
      checkEnableAddManualButton();
    });

    $('#currency-qty').on('keyup', function() {
      manualBuyPrice = document.getElementById('currency-qty').value.trim();
      document.getElementById('currency-invalid-message').display = 'none';
      if (isNaN(manualBuyPrice)) {
        document.getElementById('currency-qty').value = "";
        document.getElementById('currency-invalid-message').display = 'inline';
      }
      checkEnableAddManualButton();
    });

    $('#coin-list').click(function() {
      document.getElementById('coin-symbol').textContent = selectedManualType.toUpperCase();
    });

    $('#addDialog-button').click(function() {
      $('#addDialog').toggle();
      $('.overlay').toggle();
    });

    $('#address-dialog-button').click(function() {
      $('#choose-add-type-dialog').toggle();
      $('#address-add-dialog').toggle();
    });

    $('#manual-dialog-button').click(function() {
      $('#choose-add-type-dialog').toggle();
      $('#manual-add-dialog').toggle();
      document.getElementById('addDialog').style.height = "600px";
    });

    $('#btc-button').click(function() {
      document.getElementById('btc-button').classList.add('currency-button-selected');
      document.getElementById('eth-button').classList.remove('currency-button-selected');
      selectedAddressType = BTC;
    });

    $('#eth-button').click(function() {
      document.getElementById('eth-button').classList.add('currency-button-selected');
      document.getElementById('btc-button').classList.remove('currency-button-selected');
      selectedAddressType = ETH;
    });

    $('#wallet-address').on('keyup', function() {
      newAddress = document.getElementById('wallet-address').value.trim();
      document.getElementById('already-exists-error').display = 'none';
      document.getElementById('add-wallet-button').disabled = newAddress.length <= 0;
    });

    $('#add-wallet-button').click(function(event) {
      event.preventDefault();

      let alreadyExists = false;

      let newWallet = {
        "type": selectedAddressType,
        "address": newAddress
      };

      document.getElementById('wallet-address').value = "";

      portfolio.wallets.forEach(function (wallet) {
        if (wallet.address === newAddress) {
          alreadyExists = true;
        }
      });

      if (!alreadyExists) {
        portfolio.wallets.push(newWallet);
        fetchWalletInfo(selectedAddressType, newAddress);
        fetchTransactions(selectedAddressType, newAddress);
        closeDialog();
      } else {
        document.getElementById('already-exists-error').display = 'inline';
      }

    });

    function fetchWalletInfo(type, address) {
      let amount = "";
      let url = "";

      switch(type) {
        case BTC:
          url = `https://blockchain.info/q/addressbalance/${address}`;
          https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
              data += chunk;
              let p = JSON.parse(data);
              amount = parseFloat(p)*Math.pow(10, -8);
              if (typeof latestCoinPrices[type] != 'undefined') {
                let priceUSD = latestCoinPrices[type];
                addCoinToPortfolio(type, amount.toString(), priceUSD.toString());
              } else {
                let coin = {
                  "type": type,
                  "amount": amount
                };
                noDataLoadedCoinList.push(coin);
              }
              updatePortfolio();
            });
          });
          break;

        case ETH:
          url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ethScanApiKey}`;
          https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
              data += chunk;
              let p = JSON.parse(data);
              amount = parseFloat(p.result)*Math.pow(10, -18);

              if (typeof latestCoinPrices[type] != 'undefined') {
                let priceUSD = latestCoinPrices[type];
                addCoinToPortfolio(type, amount.toString(), priceUSD.toString());
              } else {
                let coin = {
                  "type": type,
                  "amount": amount
                };
                noDataLoadedCoinList.push(coin);
              }
              updatePortfolio();
            });
          });
          break;

        case LTC:
          break;

        default:
          break;
      }
    }

    function fetchTransactions(type, address) {
      switch(type) {
        case ETH:
          let ethTransUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ethScanApiKey}`;
          https.get(ethTransUrl, (res) => {
            let data = '';

            // A chunk of data has been recieved.
            res.on('data', (chunk) => {
              data += chunk;
              let p = JSON.parse(data);

              p.result.forEach(function(trans) {
                let date = new Date(trans.timeStamp * 1000);
                date = date.toDateString().substring(4, 10);
                let singleTransaction = {
                    "date": date,
                    "from": trans.from,
                    "to": trans.to,
                    "value": parseFloat(trans.value) * Math.pow(10, -18),
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

    /**
    * updatePortfolio loops through all the coins in the wallet 
    * and updates the information in the portfolio section 
    **/
    function updatePortfolio() {
      $(".portfolio-item-container").html("");

      portfolio.coins.forEach(function (coin) {

        if (isNaN(getCoinMarketValue(coin.type, coin.amount))) {
          $(".portfolio-item-container").append(`<div class="portfolio-item"><img src='img/${coin.type.toUpperCase()}.svg' alt='${coin.coinName}' class="portfolio-icon"><div class="CryptoCurrencyType">${coin.coinName}</div> <div class="Percent-of-Portfolio">Loading...</div><div class="CryptoCurrencyVal">${coin.amount} ${coin.type.toUpperCase()}</div><div class="USD">Loading...</div></div>`);
          $('.portfolio-total-balance').html(`Total balance: Loading...`);
        } else {
          $(".portfolio-item-container").append(`<div class="portfolio-item"><img src='img/${coin.type.toUpperCase()}.svg' alt='${coin.coinName}' class="portfolio-icon"><div class="CryptoCurrencyType">${coin.coinName}</div> <div class="Percent-of-Portfolio">${coin.percentPortfolio.toFixed(1)}%</div><div class="CryptoCurrencyVal">${coin.amount.toFixed(5)} ${coin.type.toUpperCase()}</div><div class="USD">${getCoinMarketValue(coin.type, coin.amount).toFixed(2)}</div></div>`);
          $('.portfolio-total-balance').html(`Total balance: US$${portfolio.totalUSD.toFixed(2)}`);
          // blockstack.putFile(STORAGE_FILE, JSON.stringify(portfolio));
        }
      });
    }

    function showTransactions() {
      transactions.forEach(function(data){
        let transText = "";
        let transVal = "";
        let transType;

          portfolio.wallets.forEach(function(wallet) {
          if (wallet.address === data.from) {
            transText = "Sent ";
            transVal = "-";
          }
        });

        if (transText.length === 0) {
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

    openWebSocketConnection();

    // blockstack.getFile(STORAGE_FILE).then((portfolioJson) => {
    //   portfolio = JSON.parse(portfolioJson);
    //
    //   if (portfolio.wallets.length == 0) {
    //     portfolio = {
    //       "wallets" : []
    //     };
    //   }
    //
    //   fetchTransactions(portfolio.wallets[0].type, portfolio.wallets[0].address);
    //   fetchWalletInfo(portfolio.wallets[0].type, portfolio.wallets[0].address);
    // });
  }
});

$(function() {
  var dashboardPage = new DashboardPage();
  dashboardPage.display();
});
