import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export function Sample3() {
  return (
    <View style={styles.container}>
      <Text>This is Sample #3</Text>
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

