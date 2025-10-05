import React, { forwardRef, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, UrlTile, Circle, Callout } from 'react-native-maps';
import { weatherStyles } from '../styles';

const NASAMapView = forwardRef(({ region, onRegionChange, onPress, markers = [], mapType = 'satellite' }, ref) => {
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userDroppedPin, setUserDroppedPin] = useState(null);
  const [lastMoveTime, setLastMoveTime] = useState(null);

  const handleMapReady = () => {
    console.log('Map is ready');
    setMapLoaded(true);
  };

  const handleMapError = (error) => {
    console.error('Map error:', error);
    setMapError(true);
  };

  // Handle long press to drop custom pins
  const handleLongPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setUserDroppedPin({ latitude, longitude });
    
    // Also trigger the onPress callback for weather data
    onPress && onPress(event);
    
    Alert.alert(
      '📍 Pin Dropped!',
      `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      [
        { text: 'Get Weather', onPress: () => onPress && onPress(event) },
        { text: 'Remove Pin', onPress: () => setUserDroppedPin(null) },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  // Enhanced region change with zoom level detection
  const handleRegionChange = (newRegion) => {
    console.log('🗺️ Map region changed:', newRegion);
    setLastMoveTime(new Date().toLocaleTimeString());
    onRegionChange && onRegionChange(newRegion);
  };

  if (mapError) {
    return (
      <View style={[weatherStyles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }]}>
        <Text style={{ color: '#ffffff', fontSize: 16, textAlign: 'center' }}>
          Map failed to load{'\n'}Retrying with standard view...
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#00D4AA', borderRadius: 10 }}
          onPress={() => {
            setMapError(false);
            // mapType is now controlled by parent
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>Try Standard Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={weatherStyles.container}>
      <MapView
        ref={ref}
        style={weatherStyles.map}
        region={region}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChange}
        onPress={onPress}
        onLongPress={handleLongPress}
        onMapReady={handleMapReady}
        onError={handleMapError}
        showsUserLocation={true}
        showsMyLocationButton={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        mapType={mapType}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        pointerEvents="auto"
      >
        {/* Regular Markers */}
        {markers && markers.map((marker, index) => (
          <Marker
            key={marker.key || `marker-${index}`}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor="#FF6B6B"
          >
            <Callout>
              <View style={{ padding: 10, minWidth: 150 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                  {marker.title}
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                  {marker.description}
                </Text>
                <Text style={{ fontSize: 10, color: '#888', marginTop: 3 }}>
                  📍 {marker.coordinate.latitude.toFixed(4)}, {marker.coordinate.longitude.toFixed(4)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* User Dropped Pin */}
        {userDroppedPin && (
          <Marker
            coordinate={userDroppedPin}
            title="Custom Location"
            description="Long press to drop pins"
            pinColor="#00D4AA"
          >
            <Callout>
              <View style={{ padding: 10, minWidth: 150 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                  📍 Custom Pin
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                  Tap for weather data
                </Text>
                <Text style={{ fontSize: 10, color: '#888', marginTop: 3 }}>
                  {userDroppedPin.latitude.toFixed(4)}, {userDroppedPin.longitude.toFixed(4)}
                </Text>
              </View>
            </Callout>
          </Marker>
        )}

        {/* Accuracy Circle for Current Location */}
        {markers.find(m => m.key === 'current-location') && (
          <Circle
            center={markers.find(m => m.key === 'current-location').coordinate}
            radius={100}
            fillColor="rgba(0, 212, 170, 0.1)"
            strokeColor="rgba(0, 212, 170, 0.5)"
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* Map Movement Indicator */}
      {lastMoveTime && (
        <View style={{
          position: 'absolute',
          top: 30,
          left: 20,
          backgroundColor: 'rgba(0, 212, 170, 0.9)',
          borderRadius: 8,
          padding: 8,
          zIndex: 1000,
        }}>
          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '600' }}>
            ✅ Map Moved: {lastMoveTime}
          </Text>
        </View>
      )}

      {/* Map Instructions */}
      <View style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        padding: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#00D4AA',
        zIndex: 1000,
      }}
      pointerEvents="none"
      >
        <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '500' }}>
          💡 Tap: Weather | Long Press: Drop Pin
        </Text>
      </View>

      {/* Enhanced Loading Indicator */}
      {!mapLoaded && (
        <View style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [{ translateX: -75 }, { translateY: -50 }],
          backgroundColor: 'rgba(0, 212, 170, 0.9)',
          borderRadius: 15,
          padding: 20,
          width: 150,
          alignItems: 'center'
        }}>
          <Text style={{ color: '#ffffff', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
            🌍 Loading Map...
          </Text>
        </View>
      )}
    </View>
  );
});

NASAMapView.displayName = 'NASAMapView';

export default NASAMapView;