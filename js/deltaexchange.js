"use strict";

//  ---------------------------------------------------------------------------

const Exchange = require("./base/Exchange");
const { PermissionDenied, ArgumentsRequired } = require("./base/errors");

//  ---------------------------------------------------------------------------

module.exports = class delta extends Exchange {
  describe() {
    return this.deepExtend(super.describe(), {
      id: "delta",
      name: "Delta Exchange",
      countries: [""],
      version: "v1",
      userAgent: "CCXT",
      rateLimit: 200,
      has: {
        CORS: true,
        publicAPI: true,
        privateAPI: true,
        fetchOpenOrders: true,
        fetchTickers: true,
        fetchOrder: false,
        fetchOrders: false,
      },
      timeframes: {
        "1": "1m",
        "3": "3m",
        "5": "5m",
        "15": "15m",
        "30": "30m",
        "60": "60m",
        "120": "120m",
        "240": "240m",
        "360": "360m",
        D: "1d",
        "7D": "7d",
        "30D": "30d",
        "1W": "1w",
        "2W": "2w"
      },
      urls: {
        test: "https://testnet-api.delta.exchange",
        logo: "Todo://logo.path",
        api: "https://api.delta.exchange",
        www: "https://www.delta.exchange/app",
        doc: "https://docs.delta.exchange/",
        fees: "https://www.delta.exchange/fees/",
        referral: "https://www.delta.exchange/referral-program/"
      },
      'fees': {
        'trading': {
            'tierBased': false,
            'percentage': true,
            'taker': 0.001,
            'maker': 0.001,
        },
      },
      api: {
        public: {
          get: ["products", "orderbook/{id}/l2", 'products/ticker/24hr']
        },
        private: {
          get: ["positions", 'orders', 'wallet/balances'],
          post:['orders'],
          delete:['orders']
        }
      },
      exceptions: {
        "9999": PermissionDenied
      }
    });
  }

  async fetchMarkets(){
    const response = await this.publicGetProducts();
    const result = [];
    for (let i = 0; i < response.length; i++) {
      const market = response[i];
      const id = market['id']
      const symbol = market['symbol'];
      const tickSize = this.safeFloat (market, 'tick_size');
      const active = market['trading_status'] === 'operational';
      const limits = {
        'amount': {
            'min': undefined,
            'max': undefined,
        },
        'price': {
            'min': tickSize,
            'max': undefined,
        },
        'cost': {
            'min': undefined,
            'max': undefined,
        },
      };

      const precision = {
        'amount': undefined,
        'price': undefined,
      };

      result.push({
        'active':active,
        'base':market.underlying_asset.symbol,
        'future': true,
        'id':id,
        'info': market,
        'limits':limits,
        'precision':precision,
        'quote': market.quoting_asset.symbol,
        'spot': false,
        'symbol': symbol,
        'type': 'future',
      })
    }
    return result;
  }

  async fetchL2OrderBook (symbol, params = {}) {
    if(symbol === undefined){
      throw new ArgumentsRequired('Argument required: symbol');
    }
    await this.loadMarkets ();
    const id = this.marketId (symbol);
    const orderbook  = await this.publicGetOrderbookIdL2(this.extend({ 'id': id }, params));
    return orderbook;
  }

  async fetchTicker (symbol, params = {}) {
    await this.loadMarkets ();
    let ticker = await this.publicGetProductsTicker24hr(this.extend ({
      'symbol': this.marketId (symbol),
    }, params));
    return ticker;
  }

  async getOrders(symbol, params = {}){
    await this.loadMarkets ();

    let request = {};
    if(symbol){
      const id = this.marketId (symbol);
      request.product_id = id;
    }
    
    const response = await this.privateGetOrders(this.extend(request, params));
    return response;
  }


  async fetchOpenOrders (symbol = undefined, params = {}) {  
    const response = await this.getOrders(symbol, this.extend({
      state: 'open'
    }, params));
    return response;
  }

  async fetchClosedOrders(symbol, params) {
    const response = await this.getOrders(symbol, this.extend({
      state: 'closed'
    }, params));
    return response;
  }

  async fetchBalance(){
    const response = await this.privateGetWalletBalances();
    return response;
  }
  
  parseOrder(order){
    //todo: implement parse order
    return order;
  }

  async createOrder (symbol, side, amount, price = undefined, params = {}) {
    await this.loadMarkets ();

    let request = {
      'product_id': this.marketId (symbol),
      'side': side,
      'size': amount,
      'order_type': 'market_order',
    };

    if (price !== undefined){
      request['limit_price'] = price;
      request['order_type'] = 'limit_order'
    }
        
    const response = await this.privatePostOrders (this.extend (request, params));
    const order = this.parseOrder (response);
    const id = order['id'];
    this.orders[id] = order;
    return order;
  }

  async cancelOrder (id, symbol = undefined, params = {}) {
    await this.loadMarkets ();
    const response = await this.privateDeleteOrders(this.extend({
      id:id,
      'product_id': this.marketId (symbol),
    }, params));

    return response;
  }



  sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
    let url = this.urls['test'] +'/'+ this.implodeParams(path, params);
    let query = this.omit (params, this.extractParams (path));

    if (method === 'GET') {
      if (Object.keys (query).length)
          url += '?' + this.urlencode (query);
    }

    if (api === 'private') {
      this.checkRequiredCredentials ();

      if (method !== 'GET') {
        if (Object.keys (query).length) {
          body = this.json (query);
        }
      }

      let timestamp = this.seconds();
      let signatureData = method + timestamp 

      
      if(path[0] === "/"){
        signatureData += path
      } else {
        signatureData += '/'+ path
      }

      if (method === 'GET') {
        if (Object.keys (query).length){
          signatureData += '?' + this.urlencode (query);
        }
      }

      if (body !== undefined) {
        signatureData += body
      }

      let signature = this.hmac (this.encode (signatureData), this.encode (this.secret))
      
      headers = {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
        'timestamp':timestamp,
        'signature':signature
      };
      
    }

    return { 'url': url, 'method': method, 'body': body, 'headers': headers };
  }
};
