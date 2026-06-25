import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import Home3DTab from './screens/Home3DTab';

export default class App extends Component {
  render() {
    return (
      <View style={{ flex: 1 }}>
        <Home3DTab />
      </View>
    );
  }
}

