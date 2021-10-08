import * as React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList } from 'react-native';
import { useEffect } from 'react';

import API from '../xtm/core/API';

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
          ({item}) => <StockRow data={item}/>
        }
      >
      </FlatList>
    </View>
  )
}

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
        console.log(data);
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

