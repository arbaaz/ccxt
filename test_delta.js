const ccxt = require ('./ccxt');


const delta = new ccxt.delta({'verbose': 'True',
  'apiKey': '56964ed2396d9d12f9ee5860a3aa45',
  'secret': '673f06079c47a3e28114a59f61d93c75ba446106160b53b58b21ce9c30ec',
});

const symbol = 'BTCUSDQ_29Mar';

(async function(){
  // let book = await delta.fetchOpenOrders(symbol);
  // console.log(book);
  
})();
