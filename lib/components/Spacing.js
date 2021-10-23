import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export const VSpacing = (props) => {
  let style = {height: parseInt(props.size||'1')};

  return <View style={style}/>
}

export const HSpacing = (props) => {
  let style = {width: parseInt(props.size||'1')};

  return <View style={style}/>
}
