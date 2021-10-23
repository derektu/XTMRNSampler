import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, FlatList, Alert, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Sample1 } from './lib/screens/Sample1';
import { Sample2 } from './lib/screens/Sample2';
import { Sample3 } from './lib/screens/Sample3';

// MainScreen: display buttons to navigate each sample screens
//
const screens = [
  { id: '1', text: '推薦股', route: 'Sample1', title: '推薦股'},
  { id: '2', text: '首頁Widget', route: 'Sample2', title: '首頁'},
  { id: '3', text: '範例#3', route: 'Sample3', title: 'S3'},
];

const ScreenCell = ({item, navigation}) => {
  return (
    <View style={styles.screenCell}>
       <Pressable
          style={({pressed}) => [
            { opacity: pressed ? 0.5 : 1.0 },
            styles.button,
          ]}
        onPress={() => {
          navigation.navigate(item.route, {title: item.title});
        }}
        >
        <Text style={styles.buttonText}>{item.text}</Text>
      </Pressable>
    </View>
  )  
}

const MainScreen = ({navigation}) => {
  return (
    <FlatList
      style={styles.container}
      data={screens}
      renderItem={
        ({item}) => <ScreenCell item={item} navigation={navigation}/>
      }
      numColumns={2}
    />
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  const ScreenOption = ({route}) => {
    return {
      headerBackTitleVisible: false,
      title: route.params.title    
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main" 
          component={MainScreen} 
          options={{title: 'XTMRN範例'}}/>

        <Stack.Screen name="Sample1"
          component={Sample1}
          options={ScreenOption}
        />

        <Stack.Screen name="Sample2"
          component={Sample2}
          options={ScreenOption}
        />

        <Stack.Screen name="Sample3"
          component={Sample3}
          options={ScreenOption}
        />

      </Stack.Navigator>
    </NavigationContainer>    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenCell: {
    flex: 1/2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    padding: 6,
    height: 50,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    backgroundColor: '#3c74f7',
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
  },  
});
