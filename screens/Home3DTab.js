import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Home3DTab() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          src="/assets/laocoon.html"
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000000' }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={require('../assets/laocoon.html')}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
});
