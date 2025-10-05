import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const NetworkManager = ({ onNetworkChange }) => {
  const [networkState, setNetworkState] = useState({
    isConnected: null,
    type: 'unknown',
    isWifiEnabled: null,
    details: {}
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('📡 Network state changed:', state);
      
      const newNetworkState = {
        isConnected: state.isConnected,
        type: state.type,
        isWifiEnabled: state.type === 'wifi',
        details: state.details || {}
      };
      
      setNetworkState(newNetworkState);
      
      // Call callback if provided
      if (onNetworkChange) {
        onNetworkChange(newNetworkState);
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      console.log('📡 Initial network state:', state);
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isWifiEnabled: state.type === 'wifi',
        details: state.details || {}
      });
    });

    return () => unsubscribe();
  }, [onNetworkChange]);

  const handleRefreshNetwork = async () => {
    try {
      const state = await NetInfo.fetch();
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isWifiEnabled: state.type === 'wifi',
        details: state.details || {}
      });
      
      Alert.alert(
        'Network Status Refreshed',
        `Connection: ${state.isConnected ? 'Connected' : 'Disconnected'}\nType: ${state.type}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error refreshing network:', error);
      Alert.alert('Error', 'Failed to refresh network status');
    }
  };

  const openWiFiSettings = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'WiFi Settings',
        'Please open your device WiFi settings to manage connections.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              // In a real app, you would use Linking.openSettings()
              // or a specific WiFi settings intent
              console.log('Opening WiFi settings...');
            }
          }
        ]
      );
    } else {
      Alert.alert('Platform Not Supported', 'WiFi management is primarily supported on Android');
    }
  };

  const getNetworkIcon = () => {
    if (!networkState.isConnected) return '📶❌';
    
    switch (networkState.type) {
      case 'wifi':
        return '📶';
      case 'cellular':
        return '📱';
      case 'ethernet':
        return '🌐';
      case 'bluetooth':
        return '📘';
      default:
        return '📡';
    }
  };

  const getNetworkStrength = () => {
    if (networkState.details && networkState.details.strength !== undefined) {
      return `${networkState.details.strength}%`;
    }
    return 'Unknown';
  };

  const getConnectionQuality = () => {
    if (!networkState.isConnected) return 'Disconnected';
    
    if (networkState.details && networkState.details.isConnectionExpensive) {
      return 'Limited (Expensive)';
    }
    
    switch (networkState.type) {
      case 'wifi':
        return 'WiFi - Good';
      case 'cellular':
        return 'Cellular - Variable';
      case 'ethernet':
        return 'Ethernet - Excellent';
      default:
        return 'Connected';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Manager</Text>
        <TouchableOpacity onPress={handleRefreshNetwork} style={styles.refreshButton}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.icon}>{getNetworkIcon()}</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>
              Status: {networkState.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
            <Text style={styles.detailText}>
              Type: {networkState.type?.toUpperCase() || 'UNKNOWN'}
            </Text>
            <Text style={styles.detailText}>
              Quality: {getConnectionQuality()}
            </Text>
            {networkState.type === 'wifi' && (
              <Text style={styles.detailText}>
                Strength: {getNetworkStrength()}
              </Text>
            )}
          </View>
        </View>
      </View>

      {Platform.OS === 'android' && (
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={openWiFiSettings}
          >
            <Text style={styles.controlButtonText}>📶 WiFi Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.infoText}>
          💡 This component monitors network state and provides basic network management for Android devices.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 25, 45, 0.95)',
    borderRadius: 15,
    padding: 15,
    margin: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    color: '#00D4AA',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 5,
  },
  refreshText: {
    fontSize: 16,
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 15,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  detailText: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 2,
  },
  controls: {
    marginBottom: 15,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.5)',
  },
  controlButtonText: {
    color: '#00D4AA',
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 212, 170, 0.3)',
    paddingTop: 10,
  },
  infoText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default NetworkManager;