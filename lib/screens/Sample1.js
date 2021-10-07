import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export function Sample1() {
  return (
    <View style={styles.container}>
      <Text>This is Sample #1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

