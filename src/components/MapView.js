import React, { forwardRef, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { mapStyles } from '../styles/mapStyles';
import { weatherStyles } from '../styles';

const CustomMapView = forwardRef(({ region, onRegionChange, onPress, markers = [] }, ref) => {
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleMapReady = () => {
    console.log('Map is ready');
    setMapLoaded(true);
  };

  const handleMapError = (error) => {
    console.error('Map error:', error);
    setMapError(true);
  };

  if (mapError) {
    return (
      <View style={[weatherStyles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }]}>
        <Text style={{ color: '#ffffff', fontSize: 16, textAlign: 'center' }}>
          Map failed to load{'\n'}Please check your internet connection
        </Text>
      </View>
    );
  }

  return (
    <MapView
      ref={ref}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={weatherStyles.map}
      customMapStyle={mapStyles}
      region={region}
      onRegionChange={onRegionChange}
      onPress={onPress}
      onMapReady={handleMapReady}
      onError={handleMapError}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={true}
      showsScale={false}
      toolbarEnabled={false}
      zoomEnabled={true}
      scrollEnabled={true}
      pitchEnabled={true}
      rotateEnabled={true}
      mapType="standard"
      loadingEnabled={true}
      loadingIndicatorColor="#2196F3"
      loadingBackgroundColor="#1a1a1a"
      minZoomLevel={2}
      maxZoomLevel={20}
    >
      {!mapLoaded && (
        <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -50 }, { translateY: -50 }] }}>
          <Text style={{ color: '#ffffff' }}>Loading map...</Text>
        </View>
      )}
      {markers && markers.map((marker, index) => (
        <Marker
          key={marker.key || `marker-${index}`}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
        />
      ))}
    </MapView>
  );
});

// Add display name for debugging
CustomMapView.displayName = 'CustomMapView';

export default CustomMapView;