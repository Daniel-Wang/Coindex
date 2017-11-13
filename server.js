const express = require('express')
var browserify = require('browserify-middleware');

const app = express()
const port = 5000

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
}

function allowCrossDomain(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
}

app.use(allowCrossDomain)
app.use(express.static(__dirname + '/public'))

app.get('/app.js', browserify('./client/main.js'));
app.get('/dashboard.js', browserify('./client/dashboard.js'));
app.get('/graphs.js', browserify('./client/graphs.js'));
app.get('/charts.js', browserify('./client/charts.js'));
app.get('/charts-backbone.js', browserify('./client/charts-backbone.js'));
app.get('/style', browserify('./public/'));
app.get('/coin.js', browserify('./client/coin.js'));

app.get('/coin/:coinId', function(req, res, next){

  if (!coinSet[req.params.coinId]) {
    res.type('txt').send('Coin not found');
    return;
  }
  return next();
}, function(req, res) {
  req.params["coinSet"] = coinSet;
  res.render('coin.ejs', req.params);
});

app.get('/', function(req, res){
  res.render('index.ejs');
});

app.get('/chart', function(req, res){
  res.render('partials/chart.ejs');
});

app.get('/dashboard', function(req, res){
  res.render('dashboard.ejs');
});

app.listen(process.env.PORT || port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})
