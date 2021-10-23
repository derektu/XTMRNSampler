import * as React from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import API from '../xtm/core/API';
import XTMQuoteProvider from '../xtm/ui/XTMQuoteProvider';
import { XTMField, XTMQuoteField } from '../xtm/ui/XTMQuoteField';

import { VSpacing, HSpacing } from '../components/Spacing';

/*
  Screen: 
  
  示意圖:
  - https://drive.google.com/file/d/1agZiudT4k_Ie2-cnhjGtr3ZnFg446BUN/view?usp=sharing  

  類型:
  - 首頁widget

  功能說明:

  - 揭示推薦股的前N檔
    - 同推薦股(Screen1)
    - 畫面啟動時, 透過API, 取得bundle file的內容 (定義股票清單以及欄位)
    - 利用XTMQuoteField來揭示股號/股名/股價/漲跌/漲跌幅
    - 利用API來取得現價, 計算與目標價的漲跌幅(價差)
  - 其他功能
    - 點擊商品cell時跳到商品頁面  

  ** 整合Issues **

  - 透過設定檔等方式, 連結widget與這個畫面,文字範本
  - 首頁會自動顯示widget的標題, 同時implement跳轉到完整畫面的動作
    - widget的內容不包含標題部分, 
    - widget的設定應該包含完整畫面
  - 需提供一種讓widget可以設定高度的機制
    - 例如widget load起來時, 呼叫系統的API來設定他的高度(可能要等到抓到資料後才能夠做對),

  - props.xtmitem
    - RN component可以從這裡抓到從host端傳入的參數,
    - 每個screen/widget有一個unique的編號, props.xtmitem.itemId,
      - 當RN component呼叫API時, 可以傳入這個編號, 這樣子host端就知道是那個component了,
      - for widget的高度, RN component可以call hostAPI.setWidgetHeight(this.props.xtmitem.itemId, myHeight),
    - 如果某個畫面(的code)要可以用在不同地方的話, 那在啟動畫面的地方, 應該也要可以讓使用者從native code的地方指定參數, 
      - 這些參數可以被放在 props.xtmitem.initialParams
    - for 商品相關的widget/畫面, RN component需要知道目前的商品代碼  
      - props.xtmitem.symbolId

*/

const ScreenLoading = () => {
  return (
    <View style={styles.center}>
      <ActivityIndicator></ActivityIndicator>
    </View>
  )
}

const ScreenError = ({err}) => {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{`Error:${err}`}</Text>
    </View>
  )  
}

const StockCell = (props)=> {
  let {symbolId} = props;

  return (
    <Pressable onPress={()=> {API.XTMUISvc.NavigateToSymbol(symbolId)}}>
      <View style={styles.stockCellContainer}>
        <VSpacing size='2'/>
        <View style={styles.groupText}>
          <XTMQuoteField symbolId={symbolId} field={XTMField.BaseID} style={styles.stockFieldId}/>
          <Text style={styles.stockFieldId}>(</Text>
          <XTMQuoteField symbolId={symbolId} field={XTMField.Name} style={styles.stockFieldId}/>
          <Text style={styles.stockFieldId}>)</Text>
        </View>  
        <VSpacing size='4'/>
        <XTMQuoteField symbolId={symbolId} field={XTMField.Close} style={styles.stockFieldPrice}/>
        <VSpacing size='4'/>
        <View style={styles.groupText}>
          <XTMQuoteField symbolId={symbolId} field={XTMField.Change} style={styles.stockFieldChange}/>
          <Text style={styles.stockFieldChange}>(</Text>
          <XTMQuoteField symbolId={symbolId} field={XTMField.ChangeRatio} style={styles.stockFieldChange}/>
          <Text style={styles.stockFieldChange}>)</Text>
        </View>
        <VSpacing size='2'/>
      </View>
    </Pressable>
  )
}

const StockCellRow = (props)=> {
  let {stocks} = props;

  let cells = stocks.slice(0, 5).map(stock=> {
    let symbolId = stock.id + '.TW';
    return <><StockCell symbolId={symbolId} key={symbolId}/><HSpacing size='4'/></>
  }) 

  return (
    <ScrollView horizontal={true}>
      { cells }
    </ScrollView>
  )
}

class StockWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading : true,
      err : null,
      stocks: []
    };        
  }

  componentDidMount() {
    API.AppSvc.GetFile('today_stocklist.json', (err, text)=> {
      if (err) {
        console.log(`Err=${err}`);
        this.setState({
          isLoading: false,
          err: err
        })
      }
      else {
        let data = JSON.parse(text);
        // console.log(`today_stocklist=${JSON.stringify(data)}`);
        this.setState({
          isLoading: false,
          stocks: data.stocks
        })
      }
    })
  }

  render() {
    const { isLoading, err, stocks } = this.state;

    let body;

    if (isLoading) {
      body = <ScreenLoading/>;
    }
    else if (err) {
      body = <ScreenError err={err}/>
    }
    else {
      body = <StockCellRow stocks={stocks}/>
    }

    return (
      <View style={styles.stockWidgetContainer}>
        {body}
      </View>
    )
  }
}

// 簡單的Widget container (implement widget標題)
//
const Widget = (props)=> {
  let {title, children} = props;
  
  return (
    <View style={styles.widgetContainer}>
      <View style={styles.widgetTitleRow}>
        <Text style={styles.widgetTitle}>{title}</Text>        
        <MaterialIcons name="navigate-next" size={28} color="black" />        
      </View>
      <View style={styles.divider}/>
      <View style={styles.widgetBody}>
        {children}
      </View>  
    </View>
  )
}

const ExampleWidget = (props)=> {
  let title = props.title || 'ExampleWidget';
  let height = props.height || '100';

  return (
    <Widget title={title}>
      <View style={[styles.center, {height: parseInt(height)}]}>
        <Text style={styles.widgetTitleText}>{title}</Text>
      </View>
    </Widget>
  )
}

export function Sample2() {
  return (
    <ScrollView style={styles.container}>
      <Widget title='推薦股'>
        <StockWidget/>
      </Widget>
      <ExampleWidget title='台股指數'/>
      <ExampleWidget title='即時新聞' height='160'/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    fontSize: 18,
    color: 'red',
  },

  widgetContainer: {
    flex: 1,
    padding: 4,    
  },

  widgetTitleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between', 
    marginTop: 4,
    marginBottom: 4,
  },

  widgetTitle: {
    fontSize: 20,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
    marginTop: 2,
    marginBottom: 2,
  },

  widgetBody: {
    flex: 1,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#eee',
  },

  widgetBodyText: {
    fontSize: 20,
  },

  stockWidgetContainer: {
    flex: 1,
    height: 120,
  },

  stockCellContainer: {    
    flex: 1,
    padding: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },

  groupText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  stockFieldId: {
    fontSize: 18,
  },

  stockFieldPrice: {
    fontSize: 24,
  },

  stockFieldChange: {
    fontSize: 18,
  },

});

