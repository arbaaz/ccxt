const ccxt = require ('./ccxt');


const delta = new ccxt.delta({
  // 'verbose': 'True',
  'apiKey': '56964ed2396d9d12f9ee5860a3aa45',
  'secret': '673f06079c47a3e28114a59f61d93c75ba446106160b53b58b21ce9c30ec',
  'timeout': 30000,
});

const symbol = 'BTCUSDQ_29Mar';

(async function(){
  // let book = await delta.fetchOpenOrders(symbol);
  // console.log(book.map(async x => await delta.cancelOrder(x.id, x.product.symbol)));

  // let book = await delta.fetchClosedOrders(symbol);
  // console.log(book);

  // let order = await delta.createOrder(symbol, 'buy', 1 , '3754.73');
  // console.log(order);

  // let order = await delta.fetchOrderLeverage(symbol);
  // console.log(order);

  // let order = await delta.fetchPositions(symbol);
  // console.log(order);
  
  try {
    let result = await delta.changePositionMargin(symbol, '0.5')
    console.log(result);  
  } catch(e){
    console.log(e);
  }
  

  // let order = await delta.changeOrderLeverage(symbol, '5');
  // console.log(order);
  // const balance = await delta.fetchBalance();
  // console.log('Balance', balance);

})();
