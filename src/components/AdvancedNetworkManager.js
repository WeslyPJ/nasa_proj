import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform, Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const AdvancedNetworkManager = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: null,
    type: 'unknown',
    details: {}
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        details: state.details || {}
      });
    });

    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        details: state.details || {}
      });
    });

    return () => unsubscribe();
  }, []);

  // Open device WiFi settings
  const openWiFiSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        // Try to open WiFi settings directly
        await Linking.openSettings();
      } else {
        await Linking.openURL('App-Prefs:WIFI');
      }
    } catch (error) {
      console.error('Error opening WiFi settings:', error);
      Alert.alert('Error', 'Could not open WiFi settings');
    }
  };

  // Open cellular/mobile data settings
  const openCellularSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        // Open mobile network settings
        await Linking.sendIntent('android.settings.DATA_ROAMING_SETTINGS');
      } else {
        await Linking.openURL('App-Prefs:MOBILE_DATA_SETTINGS_ID');
      }
    } catch (error) {
      console.error('Error opening cellular settings:', error);
      Alert.alert('Error', 'Could not open cellular settings. Opening general settings instead.');
      await Linking.openSettings();
    }
  };

  // Open general network settings
  const openNetworkSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('android.settings.WIRELESS_SETTINGS');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening network settings:', error);
      await Linking.openSettings();
    }
  };

  // Force network refresh
  const forceNetworkRefresh = async () => {
    try {
      const state = await NetInfo.fetch();
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        details: state.details || {}
      });
      
      Alert.alert(
        'Network Refreshed',
        `Status: ${state.isConnected ? 'Connected' : 'Disconnected'}\nType: ${state.type}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh network status');
    }
  };

  const getNetworkStatusColor = () => {
    if (!networkState.isConnected) return '#ff4444';
    if (networkState.type === 'wifi') return '#44ff44';
    if (networkState.type === 'cellular') return '#ffaa44';
    return '#4444ff';
  };

  const getNetworkIcon = () => {
    if (!networkState.isConnected) return '📵';
    switch (networkState.type) {
      case 'wifi': return '📶';
      case 'cellular': return '📱';
      case 'ethernet': return '🌐';
      default: return '📡';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📡 Network Control Center</Text>
      
      {/* Current Status */}
      <View style={[styles.statusCard, { borderColor: getNetworkStatusColor() }]}>
        <Text style={styles.statusIcon}>{getNetworkIcon()}</Text>
        <View style={styles.statusDetails}>
          <Text style={styles.statusText}>
            {networkState.isConnected ? 'Connected' : 'Disconnected'}
          </Text>
          <Text style={styles.statusSubtext}>
            {networkState.type?.toUpperCase() || 'UNKNOWN'}
          </Text>
          {networkState.details.ssid && (
            <Text style={styles.statusSubtext}>
              WiFi: {networkState.details.ssid}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={forceNetworkRefresh} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Network Controls */}
      <View style={styles.controlsSection}>
        <Text style={styles.sectionTitle}>Network Settings</Text>
        
        <TouchableOpacity style={styles.controlButton} onPress={openWiFiSettings}>
          <Text style={styles.controlIcon}>📶</Text>
          <Text style={styles.controlText}>WiFi Settings</Text>
          <Text style={styles.controlArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={openCellularSettings}>
          <Text style={styles.controlIcon}>📱</Text>
          <Text style={styles.controlText}>Mobile Data Settings</Text>
          <Text style={styles.controlArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={openNetworkSettings}>
          <Text style={styles.controlIcon}>⚙️</Text>
          <Text style={styles.controlText}>All Network Settings</Text>
          <Text style={styles.controlArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Information */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          💡 Use these controls to manage your device's network connections. 
          Settings will open in your device's system settings app.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 25, 45, 0.95)',
    borderRadius: 20,
    padding: 20,
    margin: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  title: {
    color: '#00D4AA',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
  },
  statusIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  statusDetails: {
    flex: 1,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusSubtext: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  refreshBtn: {
    padding: 10,
  },
  refreshIcon: {
    fontSize: 20,
  },
  controlsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  controlIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  controlText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  controlArrow: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 212, 170, 0.3)',
    paddingTop: 15,
  },
  infoText: {
    color: '#A0A0A0',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default AdvancedNetworkManager;