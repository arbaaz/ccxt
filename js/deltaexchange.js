"use strict";

//  ---------------------------------------------------------------------------

const Exchange = require("./base/Exchange");
const { PermissionDenied } = require("./base/errors");

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
        fetchOrder: true,
        fetchOrders: false,
        fetchOpenOrders: true,
        fetchTickers: false
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
          get: ["products", "orderbook/{id}/l2"]
        },
        private: {
          get: ["positions"]
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

  async fetchL2OrderBook (symbol, limit = undefined, params = {}) {
    await this.loadMarkets ();
    let market = this.market(symbol);
    let id = market['id'];
    console.log('Id', id);
    let orderbook = [];

    try {
       orderbook = await this.publicGetOrderbookIdL2(this.extend({ 'id': 9}, params));
    } catch(e){
      console.log(e);
    }
    
    return orderbook;
  }

  sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
    const url = this.urls['api'] +'/'+ path;
    return { 'url': url, 'method': method, 'body': body, 'headers': headers };
  }
};
