import * as React from 'react';
import { Alert } from 'react-native';

/**
 * XTMUI相關的API
 */
export default class XTMUISvc {

  /**
   * 開啟商品頁面
   * @param {string} symbolId 商品代碼
   */
  NavigateToSymbol(symbolId) {
    Alert.alert('開啟商品頁面', `SymbolID:${symbolId}`);
  }

  /**
   * 顯示商品快速menu
   * @param {string} symbolId 
   */
  DisplaySymbolMenu(symbolId) {
    Alert.alert('開啟商品快速Menu', `SymbolID:${symbolId}`);    
  }
}

