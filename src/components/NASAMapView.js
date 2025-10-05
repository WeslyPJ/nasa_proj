import React, { forwardRef, useState } from 'react';
import { Platform, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, UrlTile, Circle, Callout } from 'react-native-maps';
import { weatherStyles } from '../styles';

const NASAMapView = forwardRef(({ region, onRegionChange, onPress, markers = [], mapType = 'satellite' }, ref) => {
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userDroppedPin, setUserDroppedPin] = useState(null);
  const [lastMoveTime, setLastMoveTime] = useState(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const regionChangeTimeoutRef = React.useRef(null);

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

  // Detect if the map is zoomed too close (prevents drift)
  const isZoomedTooClose = (region) => {
    const { latitudeDelta, longitudeDelta } = region;
    // If zoomed closer than ~50 meters, consider it too close
    return latitudeDelta < 0.0005 || longitudeDelta < 0.0005;
  };

  // Enhanced region change with drift prevention
  const handleRegionChange = (newRegion) => {
    // Clear any existing timeout
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }

    // Check if zoomed too close
    if (isZoomedTooClose(newRegion)) {
      console.log('� Map zoomed very close, preventing automatic updates to avoid drift');
      setLastMoveTime('Zoomed - Auto-updates paused');
      return; // Don't propagate region changes when zoomed too close
    }

    console.log('�🗺️ Map region changed:', newRegion);
    setLastMoveTime(new Date().toLocaleTimeString());
    
    // Debounce region changes to prevent excessive updates
    regionChangeTimeoutRef.current = setTimeout(() => {
      onRegionChange && onRegionChange(newRegion);
    }, 300); // 300ms debounce
  };

  // Handle when user starts interacting with map
  const handlePanDrag = () => {
    setIsUserInteracting(true);
    setLastMoveTime('User dragging...');
  };

  // Handle when user finishes interacting with map
  const handleRegionChangeComplete = (newRegion) => {
    setIsUserInteracting(false);
    
    // Only update if not zoomed too close
    if (!isZoomedTooClose(newRegion)) {
      console.log('🏁 Map interaction complete:', newRegion);
      setLastMoveTime(new Date().toLocaleTimeString());
      onRegionChange && onRegionChange(newRegion);
    } else {
      console.log('🔍 Region change complete but zoomed too close, skipping update');
      setLastMoveTime('Zoomed close - Updates paused');
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (regionChangeTimeoutRef.current) {
        clearTimeout(regionChangeTimeoutRef.current);
      }
    };
  }, []);

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
        onRegionChangeComplete={handleRegionChangeComplete}
        onPanDrag={handlePanDrag}
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
        // Zoom constraints to prevent over-zooming and drift
        minZoomLevel={2}    // Prevent zooming out too far
        maxZoomLevel={18}   // Prevent zooming in too close (reduces drift)
        // Additional props to improve stability
        moveOnMarkerPress={false}
        loadingEnabled={true}
        loadingIndicatorColor="#00D4AA"
        loadingBackgroundColor="#1a1a1a"
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
            pinColor="#00D4AA"
          >
            <Callout>
              <View style={{ padding: 10, minWidth: 150 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                  📍 Custom Pin
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

      {/* Map Movement Indicator with Zoom Status */}
      {lastMoveTime && (
        <View style={{
          position: 'absolute',
          top: 30,
          left: 20,
          backgroundColor: isUserInteracting ? 'rgba(255, 230, 109, 0.9)' : 
                          lastMoveTime.includes('Zoomed') ? 'rgba(255, 107, 107, 0.9)' : 
                          'rgba(0, 212, 170, 0.9)',
          borderRadius: 8,
          padding: 8,
          zIndex: 1000,
          borderWidth: 1,
          borderColor: isUserInteracting ? '#FFE66D' : 
                      lastMoveTime.includes('Zoomed') ? '#FF6B6B' : 
                      '#00D4AA',
        }}>
          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '600' }}>
            {isUserInteracting ? '🖐️ Interacting...' : 
             lastMoveTime.includes('Zoomed') ? '🔍 Zoom Protection Active' :
             `✅ Last Update: ${lastMoveTime}`}
          </Text>
          {lastMoveTime.includes('Zoomed') && (
            <Text style={{ color: '#ffffff', fontSize: 8, marginTop: 2 }}>
              Preventing drift at high zoom
            </Text>
          )}
        </View>
      )}

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