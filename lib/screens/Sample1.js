import * as React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList, Pressable} from 'react-native';

import API from '../xtm/core/API';
import XTMQuoteProvider from '../xtm/ui/XTMQuoteProvider';
import { XTMField, XTMQuoteField } from '../xtm/ui/XTMQuoteField';
/*
  Screen:
  
  示意圖:
  - https://drive.google.com/file/d/1Sc2F2ZUDd4GQrOIUgsZXCjxzfI6AN3Lg/view?usp=sharing
  
  類型:
  - 獨立功能頁面

  功能說明:

  - 揭示推薦股的內容
    - 畫面啟動時, 透過API, 取得bundle file的內容 (定義股票清單以及欄位)
    - 利用XTMQuoteField來揭示股號/股名/股價/漲跌/漲跌幅
    - 利用API來取得現價, 計算與目標價的漲跌幅(價差)
  - 其他功能  
    - 點擊商品名稱時開啟商品快速menu
    - 點擊商品cell時跳到商品頁面  

  ** 整合Issues **

  - 透過設定檔等方式, 連結功能icon與這個畫面,
  - 系統會自動跳到這個畫面來, 控制navigation,
  - 對這一頁而言, 可能需要額外控制的有
    - 標題列的設定(名稱, 除了back之外是否要包含其他icon),
    - 如果要跳轉到這個功能的其他頁面時, 該怎麼串連

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

const Screen_stocks = ({stocks})=> {
  return (
    <View style={styles.stocklistContainer}>
      <FlatList
        style={styles.stocklist}
        data={stocks}
        renderItem={
          ({item}) => <StockRow4 data={item}/>
        }
      >
      </FlatList>
    </View>
  )
}

// version#1: 
// - layout only
//
const StockRow = ({data}) => {
  // data.id = "2330"
  // data.target = 725
  //
  return (
    <View style={styles.stockRow}>
      <View style={styles.stockRow_1}>
        <Text style={styles.stockFieldId}>{`${data.id}(${data.id})`}</Text>
      </View>
      <View style={styles.stockRow_2}>
        <View style={styles.stockLeftBlock}>
          <Text style={styles.stockFieldPrice}>最新價</Text>
          <Text style={styles.stockFieldChange}>漲跌(漲跌幅)</Text>
        </View>
        <View style={styles.stockRightBlock}>
          <Text style={styles.stockFieldTarget}>{`目標價:${data.target}`}</Text>
          <Text style={styles.stockFieldTargetDiff}>價差</Text>
        </View>
      </View>
    </View>
  )
}

// version#2: 
// - 使用RTSvc refQuote/unrefQuote來顯示欄位數值
//
class StockRow2 extends React.Component {
  constructor(props) {
    super(props);

    let symbolId = props.data.id + '.TW';
    this.state = {
      channelId: props.data.id,
      symbolId: symbolId,
      target: props.data.target,
      quote: API.RTSvc.getQuote(symbolId)
    }
  }

  componentDidMount() {
    API.RTSvc.initChannel(this.state.channelId, (rtquote)=> {
      // console.log(`RTQuote update:${JSON.stringify(rtquote)}`);
      this.setState({
        quote: rtquote
      })
    })
    API.RTSvc.refQuote(this.state.channelId, this.state.symbolId);
  }

  componentWillUnmount() {
    API.RTSvc.unrefQuote(this.state.channelId, this.state.symbolId);
  }

  calcTargetDiff() {
    let { target, quote } = this.state;

    if (quote.close == 0 || target == 0) {
      return 0.0;
    }
    else {
      return 100 * (target - quote.close) / target;
    }
  }

  render() {
    let { target, quote } = this.state;
    return (
      <View style={styles.stockRow}>
        <View style={styles.stockRow_1}>
          <Text style={styles.stockFieldId}>{`${quote.symbolId}(${quote.name})`}</Text>
        </View>
        <View style={styles.stockRow_2}>
          <View style={styles.stockLeftBlock}>
            <Text style={styles.stockFieldPrice}>{quote.close.toFixed(2)}</Text>
            <Text style={styles.stockFieldChange}>{`${quote.change.toFixed(2)}(${quote.changeRatio.toFixed(2)}%)`}</Text>
          </View>
          <View style={styles.stockRightBlock}>
            <Text style={styles.stockFieldTarget}>{`目標價:${target.toFixed()}`}</Text>
            <Text style={styles.stockFieldTargetDiff}>{`價差:${this.calcTargetDiff().toFixed(2)}%`}</Text>
          </View>
        </View>
      </View>
    )  
  }
}

// version#3: 
// - 使用XQMQuoteProvider來顯示欄位數值
//
const StockRow3 = (props)=> {
  let {data} = props;
  let symbolId = data.id + '.TW';
  let target = data.target;
  return (
      <XTMQuoteProvider 
        symbolId={symbolId} 
        render={(quote)=> <StockRow3Fields quote={quote} target={target}/>}
      />
    )
}

class StockRow3Fields extends React.Component {
  constructor(props) {
    super(props);
  }

  calcTargetDiff() {
    let { target, quote } = this.props;

    if (quote.close == 0 || target == 0) {
      return 0.0;
    }
    else {
      return 100 * (target - quote.close) / target;
    }
  }

  render() {
    let { target, quote } = this.props;
    return (
      <View style={styles.stockRow}>
        <View style={styles.stockRow_1}>
          <Text style={styles.stockFieldId}>{`${quote.symbolId}(${quote.name})`}</Text>
        </View>
        <View style={styles.stockRow_2}>
          <View style={styles.stockLeftBlock}>
            <Text style={styles.stockFieldPrice}>{quote.close.toFixed(2)}</Text>
            <Text style={styles.stockFieldChange}>{`${quote.change.toFixed(2)}(${quote.changeRatio.toFixed(2)}%)`}</Text>
          </View>
          <View style={styles.stockRightBlock}>
            <Text style={styles.stockFieldTarget}>{`目標價:${target.toFixed()}`}</Text>
            <Text style={styles.stockFieldTargetDiff}>{`價差:${this.calcTargetDiff().toFixed(2)}%`}</Text>
          </View>
        </View>
      </View>
    )  
  }
}

// version#4: 
// - 使用XQMQuoteField來顯示內建欄位數值
// - 使用XQMQuoteProvider來顯示價差欄位
//
const StockRow4 = (props)=> {
  let {data} = props;
  let symbolId = data.id + '.TW';
  let target = data.target;

  return (
    <Pressable onPress={()=> {API.XTMUISvc.NavigateToSymbol(symbolId)}}>
      <View style={styles.stockRow}>
        <View style={styles.stockRow_1}>
          <Pressable onPress={()=> {API.XTMUISvc.DisplaySymbolMenu(symbolId)}}>
            <View style={styles.groupText}>
              <XTMQuoteField symbolId={symbolId} field={XTMField.BaseID} style={styles.stockFieldId}/>
              <Text style={styles.stockFieldId}>(</Text>
              <XTMQuoteField symbolId={symbolId} field={XTMField.Name} style={styles.stockFieldId}/>
              <Text style={styles.stockFieldId}>)</Text>
            </View>  
          </Pressable>  
        </View>
        <View style={styles.stockRow_2}>
          <View style={styles.stockLeftBlock}>
            <XTMQuoteField symbolId={symbolId} field={XTMField.Close} style={styles.stockFieldPrice}/>
            <View style={styles.groupText}>
              <XTMQuoteField symbolId={symbolId} field={XTMField.Change} style={styles.stockFieldChange}/>
              <Text style={styles.stockFieldChange}>(</Text>
              <XTMQuoteField symbolId={symbolId} field={XTMField.ChangeRatio} style={styles.stockFieldChange}/>
              <Text style={styles.stockFieldChange}>)</Text>
            </View>
          </View>
          <View style={styles.stockRightBlock}>
            <XTMQuoteProvider 
              symbolId={symbolId} 
              render={(quote)=> <StockRow4TargetFields quote={quote} target={target}/>}
            />
          </View>
        </View>
      </View>
    </Pressable>
  )
}  

const StockRow4TargetFields = (props)=> {
  let {quote, target} = props;

  let targetStyle = {};
  if (quote.close && target > quote.close) {
    targetStyle = {color: '#f00'};
  }
  else if (quote.close && target < quote.close) {
    targetStyle = {color: '#00bb00'};
  }

  let targetDiffStyle = {};
  let targetDiffValue = '';
  if (quote.close) {
    targetDiffValue = (100 * (target - quote.close) / target).toFixed(2);
    if (target > quote.close)
      targetDiffValue = '+' + targetDiffValue;
    targetDiffValue += '%';  
  }

  return (
    <>
      <View style={styles.groupText}>
        <Text style={styles.stockFieldTarget}>目標價:</Text>
        <Text style={[styles.stockFieldTarget, targetStyle]}>{target}</Text>
      </View>
      <View style={styles.groupText}>
        <Text style={styles.stockFieldTargetDiff}>價差:</Text>
        <Text style={[styles.stockFieldTarget, targetStyle]}>{targetDiffValue}</Text>
      </View>  
    </>
  )
}

export class Sample1 extends React.Component {
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

    let Screen = ()=> {
      if (isLoading) {
        return <ScreenLoading/>;
      }
      else if (err) {
        return <ScreenError err={err}/>;
      }
      else {
        return <Screen_stocks stocks={stocks}/>;
      }
    }

    return (
      <Screen/>
    );  
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    fontSize: 18,
    color: 'red',
  },

  stocklistContainer: {
    flex: 1,
  },

  stocklist: {
    flex: 1,
    margin: 4,
  },

  stockRow: {
    flex: 1,
    flexDirection: 'column',
    borderRadius: 8,
    marginTop: 10,
    padding: 8,
    backgroundColor: '#ddd',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  stockRow_1: {
    flex: 1,
    marginTop: 6,
    marginBottom: 6,
  },

  stockRow_2: {
    flex: 1,
    flexDirection: 'row',
  },

  stockLeftBlock: {
    flex: 1,
    flexDirection: 'column',
  },

  stockRightBlock: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    width: '25%',
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
    marginBottom: 8,
  },

  stockFieldChange: {
    fontSize: 18,
  },

  stockFieldTarget: {
    fontSize: 16,
    marginBottom: 8,
  },

  stockFieldTargetDiff: {
    fontSize: 16,
  },

});

