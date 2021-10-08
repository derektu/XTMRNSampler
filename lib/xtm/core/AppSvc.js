/**
 * AppSvc相關的API
 */
export default class AppSvc {
  /**
   * 回傳某個檔案的內容(as text)
   * @param {string} fileID 檔案編號
   * @param {*} cb Callback function cb(err, string)
   */
  GetFile(fileID, cb) {
    /*
      Design notes:

      GetFile實際的作法, 應該是call host的API, host端讀檔後回傳

      在這裡呼叫mockserver/api/getfile?file=<fileid>來模擬, fileID會直接對到檔名
      
      從native端傳資料到javascript端時, 只能傳number, string這些格式, 並不支援buffer

      所以這個API僅支援text-based的data (JSON, xml, etc.)
    */      
    let host = 'https://0293-2001-b400-e282-3ecc-30a4-8cac-de6e-c968.ngrok.io/';
    let url = `${host}/xtmrnserver/api/getfile?file=${fileID}`;

    fetch(url)
      .then((response)=> {
        if (response.ok) {
          return response.text();
        }
        else {
          throw `HTTP code=${response.status} text=${response.statusText}`;
        }
      })
      .then((text)=> {
        cb(null, text);
      })
      .catch((err)=> {
        cb(err);
      })
  }  

  /**
   * 呼叫內建的API服務(在AppSvc上面寫一支標準的API, 讓券商可以自由擴充), 傳入op編號, 以及參數
   * 
   * @param {string} op API的編號 
   * @param {object} params API的參數, 用object的方式傳入, 例如{p1:'a', p2:'b'}, 底層再把這些參數轉成url param 
   * @param {*} cb Callback function cb(err, object)
   */
  CallService(op, params, cb) {
    /*
      Design notes:

      CallServer實際的作法, 應該是call host的API, host端call AppSvc的特定API後回傳response

      在這裡呼叫mockserver/api/callsvc?op=<op>來模擬      
    */
    let host = 'https://800e-114-37-158-159.ngrok.io/';
    let url = `${host}/xtmrnserver/api/callsvc?op=${op}`;

    fetch(url)
      .then((response)=> {
        if (response.ok) {
          return response.json();
        }
        else {
          throw `HTTP code=${response.status} text=${response.statusText}`;
        }
      })
      .then((json)=> {
        cb(null, json);
      })
      .catch((err)=> {
        cb(err);
      })
  
  }

}
