const ccxt = require ('./ccxt');


const delta = new ccxt.delta({'verbose': 'True'});

(async function(){
  let book = await delta.fetchL2OrderBook('BTCUSDQ_29Mar');
  console.log(book);
})();
