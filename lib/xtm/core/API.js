/*
  模擬 xtm 所提供的API interface (singleton)

  預計架構

  import API from '.. xtm/core/API';

  API.AppSvc.doSomething      (for AppSvc related command, such as GetFile, CallSvc, etc.)
  API.RT.doSomething          (for RT related command, such as RefQuote, UnRefQuote, etc.)
  API.DataSvc.doSomething     (for 商品的其他資料, 例如籌碼資料等)
  API.Trade.doSomething       (for 交易相關的comand)
  API.XTM.doSomething         (AP相關的command, 例如開啟某個功能, navigation, 存取資料等)
*/

import AppSvc from './AppSvc';

class APIObject {
  static _instance = null;

  static getInstance() {
    if (!APIObject._instance) {
      APIObject._instance = new APIObject();
    }
    return APIObject._instance;
  }

  constructor() {
    this.AppSvc = new AppSvc();
  }
}

const API = APIObject.getInstance();

export default API;
