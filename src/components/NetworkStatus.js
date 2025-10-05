import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../constants';

const NetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [networkType, setNetworkType] = useState('wifi');
  const [backendStatus, setBackendStatus] = useState('unknown');

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('📡 Network state:', state);
      setIsConnected(state.isConnected);
      setNetworkType(state.type);
      
      if (!state.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    });

    // Check backend connectivity on mount
    checkBackendConnectivity();

    return () => unsubscribe();
  }, []);

  const checkBackendConnectivity = async () => {
    try {
      console.log('🔌 Checking backend connectivity...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setBackendStatus('connected');
        console.log('✅ Backend connectivity check successful');
      } else {
        setBackendStatus('error');
        console.log('❌ Backend responded with error:', response.status);
      }
    } catch (error) {
      setBackendStatus('disconnected');
      console.log('❌ Backend connectivity check failed:', error.message);
    }
  };

  const getNetworkIcon = () => {
    if (!isConnected) return '📶❌';
    
    switch (networkType) {
      case 'wifi':
        return '📶';
      case 'cellular':
        return '📱';
      case 'ethernet':
        return '🌐';
      default:
        return '📶';
    }
  };

  const getBackendIcon = () => {
    switch (backendStatus) {
      case 'connected':
        return '✅';
      case 'disconnected':
        return '❌';
      case 'error':
        return '⚠️';
      default:
        return '🔄';
    }
  };

  const getStatusColor = () => {
    if (!isConnected || backendStatus === 'disconnected') {
      return '#ff4444';
    }
    if (backendStatus === 'error') {
      return '#ff9900';
    }
    if (backendStatus === 'connected') {
      return '#44ff44';
    }
    return '#999999';
  };

  return (
    <View style={[styles.container, { borderColor: getStatusColor() }]}>
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          {getNetworkIcon()} Network: {isConnected ? networkType.toUpperCase() : 'OFFLINE'}
        </Text>
        <Text style={styles.statusText}>
          {getBackendIcon()} Backend: {backendStatus.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    margin: 10,
    borderRadius: 8,
    borderWidth: 2,
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 1000,
    minWidth: 200,
  },
  statusRow: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 2,
  },
});

export default NetworkStatus;