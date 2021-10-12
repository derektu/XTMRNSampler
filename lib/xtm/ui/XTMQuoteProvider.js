/**
 * XTMQuoteProvider
 * 
 * 使用情境:
 * 
 * 如果要依照報價行情來render內容的話, 目前有兩種選擇:
 * 
 * 1. 在component內使用 RTSvc.refQuote/unrefQuote, 自由度最大, 可是最複雜,
 * 2. 如果要render單一欄位, 可以使用 <XTMQuoteField ..>, 傳入所需欄位編號,
 * 
 * 
 * 如果想要render的資料並不是內建的欄位, e.g. 想要render 目標價與現價的差異%, 目標價從其他地方傳入, 現價要取quote的close的話,
 * 此時當然可以使用approach#1, 在component內自行處理ref/unref/callback的邏輯.
 * 
 * 另外一種更簡單的作法, 則是透過XQMQuoteProvider, 然後透過render props的方式, 來implement rendering的logic.
 * 
 * 使用範例:
 * 
 * <XTMQuoteProvider symbolId="2330.TW" render={(quote)=> (
 *     <MyField quote={quote}/>
 *   )}
 * />
 *
 * const MyField = ({quote}) => {
 *  return (
 *    ...
 *  )
 * }
 * 
 * XQMQuoteProvider需要兩個參數
 * - symbolId: 傳入要reference的商品代碼
 * - render: 傳入render函數, render函數會傳入一個quote參數
 */

import React from "react";
import PropTypes from 'prop-types';
import API from '../core/API';
import { RTSvc, RTQuote } from '../core/RTSvc'; 

/**
 * static class
 * 
 * 用來提供XQMQuoteProvider所需的Quote ref服務
 */
class QuoteClient {
  static _instance = null;

  static getInstance() {
    if (!QuoteClient._instance) {
      QuoteClient._instance = new QuoteClient();
    }
    return QuoteClient._instance;
  }

  constructor() {
    this.channelId = '';
    this.refs = {};
      // key = symbolId
      // value = Set of cb, where cb is 從caller端(XTMQuoteProvider)傳過來的callback
      //
      // 也就是說我們用refs來implement reference count, 以及記錄callback的位置
      //
  }

  refQuote(symbolId, cb) {
    if (!this.channelId) {
      this._initRTSvc();
    }

    let key = symbolId.toLowerCase();
    let refSet = this.refs[key];
    if (refSet) {
      refSet.add(cb);
    }
    else {
      this.refs[key] = new Set([cb]);
      // 第一次ref這個商品
      API.RTSvc.refQuote(this.channelId, symbolId);
    }
  }

  unrefQuote(symbolId, cb) {
    let key = symbolId.toLowerCase();
      
    let refSet = this.refs[key];
    if (!refSet) {
      console.warn(`QuoteClient.unrefQuote() invalid symbol:${symbolId}`);
      return;
    }

    if (refSet.has(cb)) {
      refSet.delete(cb);
      if (refSet.size == 0) {
        // 這個商品已經沒有client refs了
        API.RTSvc.unrefQuote(this.channelId, symbolId);
        delete this.refs[key];
      }
    }
    else {
      console.warn(`QuoteClient.unrefQuote() invalid callback:${symbolId}`);
      return;
    }
  }

  _initRTSvc() {
    this.channelId = `QuoteClient:${Date.now().toString()}`;
    API.RTSvc.initChannel(this.channelId, (quote)=> {
      let refSet = this.refs[quote.symbolId.toLowerCase()];
      
      refSet.forEach((cb)=> {
        // fire callback
        cb(quote);    
      })
    });
  }
}

export default class XTMQuoteProvider extends React.Component {
  constructor(props) {
    super(props);
    let symbolId = this.props.symbolId;
    this.state = {
      symbolId: symbolId,
      quote: API.RTSvc.getQuote(symbolId)
    }

    this.cbEntry = this._onUpdateQuote.bind(this);
  }

  componentDidMount() {
    let { symbolId } = this.state;

    QuoteClient.getInstance().refQuote(symbolId, this.cbEntry);
  }

  componentWillUnmount() {
    let { symbolId } = this.state;

    QuoteClient.getInstance().unrefQuote(symbolId, this.cbEntry);
  }

  _onUpdateQuote(quote) {
    // console.log(`XTMQuoteProvider quote updated:${JSON.stringify(quote)}`);
    this.setState({quote:quote});
  }

  render() {
    return this.props.render(this.state.quote);
  }
}

XTMQuoteProvider.propTypes = {
  symbolId: PropTypes.string,
  render: PropTypes.func.isRequired
};
