import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { loadingStyles } from '../styles';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <View style={loadingStyles.container}>
      <Text style={loadingStyles.logo}>🌍 ForeTrip</Text>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={loadingStyles.text}>{message}</Text>
    </View>
  );
};

export default LoadingScreen;