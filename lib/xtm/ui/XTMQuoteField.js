/**
 * XQMQuoteField
 * 
 * 依照預設的顯示方式, 揭示商品指定的欄位.
 * 
 * 支援參數
 * 
 * style(內建)
 * 
 * - 使用者可以使用style來設定顯示的樣式, 例如字體大小(fontSize). 目前XTM的字體大小有個級距表, 可是考慮到畫面layout時可能有不同的需求,
 *   另外畫面內也可能夾雜其他文字, 例如想要顯示 股名 + '(' + 代碼 + ')'時, '(', ')'也必須指定字體大小, 所以使用時應該從client端
 *   傳入fontSize. (我們應該把字體級距表所對應的fontSize告知客戶)
 * 
 * - 因為部分價量欄位有內建的顏色邏輯, 所以style內應該不要傳入價量的顏色, 依照theme這個參數來決定(see below). 可是萬一傳入的話, 
 *   component就會依照指定的顏色顯示(僅支援單色).
 * 
 * - TODO: 如果client端某些欄位的顏色希望跟內建顏色一樣的話, 例如要顯示價差欄位, 希望用跟上漲/下跌一樣的紅綠色的話, 那client會希望知道
 *   色盤的顏色.
 * 
 * - In summary: component會有自己的顏色/字體, 可是可以透過style來override
 * 
 * theme(指定顯示色系)
 * 
 * - 目前XTM有兩種色系(?), 可以依照這個參數來決定要顯示哪種色系
 * - Note: 顯示的顏色應該依照目前是dark or light自動調整, 
 * - TODO: client端應該也要可以讀到這個設定, 好決定如果要自己指定顏色時應該如何處理
 * 
 * changePrefix(漲跌/漲跌幅的前綴方式)
 * 
 * - 傳入 one of XTMFieldChangePrefix, 用來控制漲跌/漲跌幅欄位的顯示格式
 * - TODO: 也許有其他的設計方式 
 * - TODO: '後綴'也可能需要參數 ? 例如漲跌幅是否要顯示'%' ?
 * - TODO: 也許除了漲跌/漲跌幅這兩個欄位之外, 也有其他欄位有不同的顯示模式需要支援 ?
 * 
 */
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

const _ = require('lodash');

import XTMQuoteProvider from './XTMQuoteProvider';

// TODO: 這個欄位表可以從native端直接export出來嗎 ?
//
export const XTMField = {
  ID: 1,
  Name: 2,
  Date: 11,
  Open: 12,
  High: 13,
  Low: 14,
  Close: 15,
  Change: 16,
  ChangeRatio: 17,
  TotalVolume: 18,

  Time: 21,
  TickVolume: 22,
  // ...
}

/**
 * 漲跌/漲跌幅前綴的樣式
 */
export const XTMFieldChangePrefix = {
  None: 0,          // 不需前綴
  Triangle: 1,      // 前綴三角形
  PlusMinus: 2,     // 前綴+/-
}

export class XTMQuoteField extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <XTMQuoteProvider {...this.props} render={(quote)=> this.render_field(quote)}/>
    )
  }  

  getChangeValueStyle(quote) {
    let value = '';
    let style = {};
    if (!quote.close || !quote.preClose) {
      value = '-';
    }
    else {
      value = (quote.close - quote.preClose).toFixed(quote.dp);
      if (quote.close > quote.preClose) {
        value = '+' + value;
        // 上漲
        style.color = '#f00';
      }
      else if (quote.close < quote.preClose) {
        // 下跌
        style.color = '#00bb00';
      }
      else {
        // 平盤
        style.color = '#222';
      }
    }  
    return { value, style };
  }

  getChangeRatioValueStyle(quote) {
    let value = '';
    let style = {};
    if (!quote.close || !quote.preClose) {
      value = '-';
    }
    else {
      value = 100 * (quote.close - quote.preClose) / quote.preClose;
      value = Math.abs(value).toFixed(2) + '%';   // 不顯示+/-
      if (quote.close > quote.preClose) {
        // 上漲
        style.color = '#f00';
      }
      else if (quote.close < quote.preClose) {
        // 下跌
        style.color = '#00bb00';
      }
      else {
        // 平盤
        style.color = '#222';
      }
    }  
    return { value, style };
  }

  getPriceValueStyle(quote, price) {
    let value = '';
    let style = {};

    if (!quote.close || !price) {
      value = '-';
    }
    else {
      value = price.toFixed(quote.dp);

      if (price > quote.preClose) {
        if (!quote.upperLimit && price >= quote.upperLimit) {
          // 漲停
          style.color = '#fff';
          style.backgroundColor = '#f00';
        }
        else {
          // 上漲
          style.color = '#f00';
        }
      }
      else if (price < quote.preClose) {
        if (!quote.downLimit && price <= quote.downLimit) {
          // 跌停
          style.color = '#fff';
          style.backgroundColor = '#00bb00';
        }
        else {
          // 下跌
          style.color = '#00bb00';
        }
      }
      else {
        // 平盤
        style.color = '#222';
      }
    }
    return { value, style };
  }


  render_field(quote) {
    let {field, changePrefix} = this.props;

    let value = '';
    let style = {};

    switch (field) {
      case XTMField.ID:
        value = quote.symbolId;
        break;

      case XTMField.Name:
        value = quote.name || quote.symbolId.split('.')[0];
        break;

      case XTMField.Date:
        value = !quote.date ? '-' : quote.date;  
        break;

      case XTMField.Open:
        ({value, style} = this.getPriceValueStyle(quote, quote.open));
        break;

      case XTMField.High:
        ({value, style} = this.getPriceValueStyle(quote, quote.high));
        break;

      case XTMField.Low:
        ({value, style} = this.getPriceValueStyle(quote, quote.low));
        break;

      case XTMField.Close:
        ({value, style} = this.getPriceValueStyle(quote, quote.close));
        break;

      case XTMField.Change:
        ({value, style} = this.getChangeValueStyle(quote));
        break;
      
      case XTMField.ChangeRatio:
        ({value, style} = this.getChangeRatioValueStyle(quote));
        break;

      case XTMField.TotalVolume:
        value = quote.totalVolume.toString();
        break;

      case XTMField.Time:
        value = !quote.close ? '-' : quote.tick.time.toString();
        value = _.padStart(value, 6, '0');
        break;
      
      case XTMField.TickVolume:
        value = !quote.close ? '0' : quote.tick.volume.toString();
        // TODO: 根據內外盤給顏色
        break;

      default:
        value = '-';
        break;          
    }


    return <Text style={[style, this.props.style]}>{value}</Text>;
  }
}

XTMQuoteField.propTypes = {
  symbolId: PropTypes.string,
  field: PropTypes.number
};


