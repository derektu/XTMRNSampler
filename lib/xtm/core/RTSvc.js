/**
 * RT相關的API
 */

const _ = require('lodash');

/**
 * Quote object
 * 
 * TODO:
 * - 補上st(symbol type), 
 * - 補上sp(spread type),
 * - 補上更多的Quote欄位(if necessary, 把零股, 盤前等欄位放到sub-object內)
 * - 價/量都給實際數值(前端不要管底層欄位的處理邏輯, native端會以string的方式傳送, 要注意rounding的問題)
 * - Javascript端可以提供一些欄位處理邏輯, 例如轉成符合跳動點的字串, 量的formatting API, etc.
 */
export class RTQuote {
  constructor() {
    this.symbolId = ''; 
    this.name = '';
    this.dp = 0;            // Decimal point
    this.date = 0;          // 交易日(yyyyMMdd)
    this.prevVolume = 0;    // 昨日成交量
    this.prevClose = 0;     // 昨收(當日參考價)
    this.open = 0;
    this.high = 0;
    this.low = 0;
    this.close = 0;
    this.avgPrice = 0;      // 當日均價
    this.upperLimit = 0;    // 漲停
    this.downLimit = 0;     // 跌停
    this.totalVolume = 0;   // 總成交量

    this.tick = {
      index: 0,             // Tick編號, 1-based, 0=沒有資料, 
      time: 0,              // 成交時間, HHmmss,
      bid: 0,               // 成交當時買進價
      ask: 0,               // 成交當時賣出價
      volume: 0,            // Tick成交量
      inout: 0,             // 內外盤註記: 
    },

    this.bid = [            // 五檔買進價
      0, 0, 0, 0, 0
    ],

    this.ask = [            // 五檔賣出價
      0, 0, 0, 0, 0
    ],

    this.bidSize = [        // 五檔買進委託量
      0, 0, 0, 0, 0
    ],

    this.askSize = [        // 五檔賣出委託量
      0, 0, 0, 0, 0
    ]
  }

  /**
   * 漲跌
   */
  get change() {
    if (this.prevClose == 0 || this.close == 0) {
      return 0;
    }
    else {
      return this.close - this.prevClose;
    }
  }

  /**
   * 漲跌幅
   */
  get changeRatio() {
    if (this.prevClose == 0 || this.close == 0) {
      return 0;
    }
    else {
      return 100 * (this.close - this.prevClose) / this.prevClose;
    }
  }

  /**
   * 把server回傳的Quote資料(JSON object)轉成 RTQuote
   * 
   * 目前因為回傳的資料跟RTQuote一模一樣, 所以就沒做其他處理
   * 
   * @param {object} quotedata JSON object for this quote data 
   */
  static fromJSON(quotedata) {
    let rtquote = new RTQuote();
    Object.assign(rtquote, quotedata);
    return rtquote;
  }

  /**
   * 回傳一個'空'的 RTQuote
   * @param {string} symbolId XQ Symbol ID
   */
  static buildEmptyQuote(symbolId) {
    let quote = new RTQuote();
    quote.symbolId = symbolId;
    quote.name = symbolId.split('.')[0];    // TODO: "1101.TW" -> "1101"
    return quote;
  }
}

class RTChannel {  
  constructor(channelId, cb) {
    this.channelId = channelId;
    this.cb = cb;
    this.refs = new Set();
  }

  /**
   * Add ref
   * @param {string} symbolId 
   */
  ref(symbolId) {
    this.refs.add(symbolId.toLowerCase());
  }

  /**
   * Remove ref
   * @param {*} symbolId 
   */
  unref(symbolId) {
    this.refs.delete(symbolId.toLowerCase());
  }
}

export class RTSvc {

  constructor() {
    this.quotes = {};       // map(symbolId->RTQuote)
    this.channels = {};     // map(channelId->RTChannel)

    this._timerId = 0;
  }

  /**
   * 建立一個channel, 同時設定資料回傳的callback.
   * 
   * 考慮到應用端可能會同時有多個component會需要取得行情資料, 所以每個component可以獨立設定
   * 他自己的channelId/callback.
   * 
   * 每個channelId可以呼叫QuoteRef, 其中的symbolId必須是unique的, 也就是說應用端必須自己
   * 處理ref counting.
   * 
   * However, 不同的channelId所呼叫的QuoteRef內的symbolId則可以重複. 
   * 
   * 整個ref count的機制, 以及channelId的機制, 可以implement在javascript端, host端可以假設
   * 所有的ref symbol都是unique的, 不需處理ref counting的機制.
   * 
   * @param {string} channelId 任意unique string, 用來代表這個channel的id
   * @param {*} cb function to receive quote update, fn(data), where data is a RTQuote object
   */
  initChannel(channelId, cb) {
    let rtc = this.channels[channelId];
    if (!rtc)
      this.channels[channelId] = new RTChannel(channelId, cb);
    else
      rtc.cb = cb; 
  }

  /**
   * Add quote referenec for this symbol, on this channelId.
   * 
   * Note:
   * - refQuote之前, 必須先確保channel已經建立(by calling initChannel)
   * - 同一個channelId內, QuoteRef的symbolId必須是unique.
   * 
   * 當價格更新時, 會透過Callback回傳更新的Quote資料. 
   * 
   * @param {string} channelId 任意unique string, 用來代表這個channel的id. 
   * @param {string} symbolId XQ symbol ID格式, 例如"2330.TW", case-insensitive. 
   */
  refQuote(channelId, symbolId) {
    // console.log(`refQuote on channel:[${channelId}] symbolId=${symbolId}`);    
    
    let rtc = this.channels[channelId];
    if (!rtc)
      throw `refQuote: channleId(${channelId}) does not exist`;

    rtc.ref(symbolId);  

    // Kick off background ref/unref tasks
    //
    this._ensureBackgroundTimer();   
  }

  /**
   * Remove quote reference for this channel, on this channelId.
   * 
   * @param {string} channelId 任意unique string, 用來代表這個channel的id. 
   * @param {string} symbolId XQ symbol ID格式, 例如"2330.TW", case-insensitive. 
   */
  unrefQuote(channelId, symbolId) {
    // console.log(`unrefQuote on channel:[${channelId}] symbolId=${symbolId}`);    

    let rtc = this.channels[channelId];

    if (!rtc)
      throw `unrefQuote: channleId(${channelId}) does not exist`;

    rtc.unref(symbolId);  
  }

  /**
   * 讀取最新的Quote資料.
   * 
   * 這個API不需傳入channelId (所有的channel會share同樣的quote data)
   * 
   * Note: 
   * - 只有當某個channel曾經refQuote這個symbol時, 才會取得有意義的資料
   * - 當所有channel都unref這個symbol後, 資料就不會再更新了
   * 
   * Implementation只會回傳javascript端的cache資料, 不會呼叫host端 (所以這是sync的API).
   * API的目的是讓UI端可以提前有資料更新. 
   * 
   * @param {string} symbolId XQ symbol ID格式, 例如"2330.TW", case-insensitive. 
   * @returns {RTQuote} 回傳RTQuote object.
   */
  getQuote(symbolId) {
    let quote = this.quotes[symbolId.toLowerCase()];
    if (!quote) {
      quote = RTQuote.buildEmptyQuote(symbolId);
    }
    return quote;
  }

  /**
   * Mock data
   * 
   * 如果有reference, 則啟動background timer, 定時更新
   */
  _ensureBackgroundTimer() {

    if (this._timerId)
      return;

    this._timerId = setTimeout(()=> {
      this._updateQuotes();
    }, 500);  
  }

  _updateQuotes() {

    let symbolIds = this._getQuoteSymbolIds();
    if (symbolIds.length == 0) {
      clearTimeout(this._timerId);
      this._timerId = 0;
      return;
    }

    this._getQuotes(symbolIds, (err, rtqs)=> {
      if (err) {
        console.log(err);   // will try on next timer
      }
      else {
        _.each(rtqs, (rtquote)=> {
          // update quote data
          this.quotes[rtquote.symbolId] = rtquote;

          // fire callback to each channel that refs this symbol
          _.each((this.channels), (rtc)=> {
            if (rtc.refs.has(rtquote.symbolId.toLowerCase())) {
              rtc.cb(rtquote);
            }
          })
        })
      }
      // kick out next timer
      //
      this._timerId = setTimeout(()=> {
        this._updateQuotes();
      }, 1000);
    })
  }

  /**
   * 取得目前ref的所有商品代碼
   */
  _getQuoteSymbolIds() {
    let allSymbols = new Set();
    _.each(this.channels, (rtc)=> {
      _.each([...rtc.refs], (symbolId)=>{
        allSymbols.add(symbolId);
      })
    })   
    return [...allSymbols];
  }

  /**
   * Mock data
   * 
   * 呼叫server, 取得rtQuote資料
   * 
   * @param {string[]} symbolIds array of SymbolID
   * @param {*} cb callback function fn(err, data), where data is array of RTQuote
   */
  _getQuotes(symbolIds, cb) {
    
    let baseIds = _.map(symbolIds, (symbolId)=> {
      return symbolId.split('.')[0];   // Hack: 2330.TW -> 2330
    })

    let host = 'https://0293-2001-b400-e282-3ecc-30a4-8cac-de6e-c968.ngrok.io';
    let url = `${host}/xtmrnserver/api/rtquote?id=${baseIds.join(',')}`;

    // console.log(url);

    fetch(url)
      .then((response)=> {
        if (response.ok) {
          return response.json();
        }
        else {
          throw `HTTP code=${response.status} text=${response.statusText}`;
        }
      })
      .then((data)=> {
        // data = [ <Object>, <Object> ]
        let rtqs = _.map(data, (item)=> {
          return RTQuote.fromJSON(item);
        })
        cb(null, rtqs);
      })
      .catch((err)=> {
        cb(err);
      })
  }
}
