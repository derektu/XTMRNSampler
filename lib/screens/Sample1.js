import * as React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList } from 'react-native';

import API from '../xtm/core/API';
import XTMQuoteProvider from '../xtm/ui/XTMQuoteProvider';
/*
  Screen: 
  
  https://drive.google.com/file/d/1Sc2F2ZUDd4GQrOIUgsZXCjxzfI6AN3Lg/view?usp=sharing

  Tasks:

  - 畫面啟動時, 透過API, 取得bundle file的內容 (定義股票清單以及欄位)
  - 利用XTMQuoteField來揭示股號/股名/股價/漲跌/漲跌幅
  - 利用API來取得現價, 計算與目標價的漲跌幅(價差)
*/

const Screen_loading = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator></ActivityIndicator>
    </View>
  )
}

const Screen_error = ({err}) => {
  return (
    <View style={styles.container}>
      <Text>{`Error has occurred:${err}`}</Text>
    </View>
  )  
}

const Screen_stocks = ({stocks})=> {
  return (
    <View style={styles.stocklist_container}>
      <FlatList
        style={styles.stocklist}
        data={stocks}
        renderItem={
          ({item}) => <StockRow3 data={item}/>
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
    <View style={styles.stock_row}>
      <View style={styles.stock_row_1}>
        <Text style={styles.stock_id}>{`${data.id}(${data.id})`}</Text>
      </View>
      <View style={styles.stock_row_2}>
        <View style={styles.stock_leftblock}>
          <Text style={styles.stock_price}>最新價</Text>
          <Text style={styles.stock_change}>漲跌(漲跌幅)</Text>
        </View>
        <View style={styles.stock_rightblock}>
          <Text style={styles.stock_target}>{`目標價:${data.target}`}</Text>
          <Text style={styles.stock_targetdiff}>價差</Text>
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
      <View style={styles.stock_row}>
        <View style={styles.stock_row_1}>
          <Text style={styles.stock_id}>{`${quote.symbolId}(${quote.name})`}</Text>
        </View>
        <View style={styles.stock_row_2}>
          <View style={styles.stock_leftblock}>
            <Text style={styles.stock_price}>{quote.close.toFixed(2)}</Text>
            <Text style={styles.stock_change}>{`${quote.change.toFixed(2)}(${quote.changeRatio.toFixed(2)}%)`}</Text>
          </View>
          <View style={styles.stock_rightblock}>
            <Text style={styles.stock_target}>{`目標價:${target.toFixed()}`}</Text>
            <Text style={styles.stock_targetdiff}>{`價差:${this.calcTargetDiff().toFixed(2)}%`}</Text>
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
      <View style={styles.stock_row}>
        <View style={styles.stock_row_1}>
          <Text style={styles.stock_id}>{`${quote.symbolId}(${quote.name})`}</Text>
        </View>
        <View style={styles.stock_row_2}>
          <View style={styles.stock_leftblock}>
            <Text style={styles.stock_price}>{quote.close.toFixed(2)}</Text>
            <Text style={styles.stock_change}>{`${quote.change.toFixed(2)}(${quote.changeRatio.toFixed(2)}%)`}</Text>
          </View>
          <View style={styles.stock_rightblock}>
            <Text style={styles.stock_target}>{`目標價:${target.toFixed()}`}</Text>
            <Text style={styles.stock_targetdiff}>{`價差:${this.calcTargetDiff().toFixed(2)}%`}</Text>
          </View>
        </View>
      </View>
    )  
  }
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
        return <Screen_loading/>;
      }
      else if (err) {
        return <Screen_error err={err}/>;
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stocklist_container: {
    flex: 1,
  },

  stocklist: {
    flex: 1,
    margin: 4,
  },

  stock_row: {
    flex: 1,
    flexDirection: 'column',
    borderRadius: 8,
    marginTop: 10,
    padding: 8,
    backgroundColor: '#ddd',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  stock_row_1: {
    flex: 1,
    marginTop: 6,
    marginBottom: 6,
  },

  stock_row_2: {
    flex: 1,
    flexDirection: 'row',
  },

  stock_leftblock: {
    flex: 1,
    flexDirection: 'column',
  },

  stock_rightblock: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    width: '25%',
  },

  stock_id: {
    fontSize: 18,
  },

  stock_price: {
    fontSize: 24,
    marginBottom: 8,
  },

  stock_change: {
    fontSize: 18,
  },

  stock_target: {
    fontSize: 16,
    marginBottom: 8,
  },

  stock_targetdiff: {
    fontSize: 16,
  },

});

