import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StatusBar, Alert, TouchableOpacity, Text } from 'react-native';
import { WeatherCard, LocationSearch, LoadingScreen, NASAMapView, CompactSearchBar } from './src/components';
import { fetchWeatherData } from './src/utils/apiUtils';
import { POPULAR_LOCATIONS } from './src/constants';
import { weatherStyles, fabStyles } from './src/styles';
import * as Location from 'expo-location';

const WeatherApp = () => {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [mapType, setMapType] = useState('satellite');
  const mapRef = useRef(null);
  const regionUpdateTimeoutRef = useRef(null);
  const lastWeatherFetchRef = useRef(null);
  const locationWatchRef = useRef(null);
  const mapRegionDelayRef = useRef(null);

  // Enhanced zoom levels based on location type
  const getZoomLevel = (locationType) => {
    const zoomLevels = {
      'street_address': { latitudeDelta: 0.002, longitudeDelta: 0.002 }, // Very close
      'route': { latitudeDelta: 0.005, longitudeDelta: 0.005 }, // Street level
      'neighborhood': { latitudeDelta: 0.01, longitudeDelta: 0.01 }, // Neighborhood
      'locality': { latitudeDelta: 0.02, longitudeDelta: 0.02 }, // City level
      'administrative_area_level_3': { latitudeDelta: 0.05, longitudeDelta: 0.05 }, // County
      'administrative_area_level_2': { latitudeDelta: 0.1, longitudeDelta: 0.1 }, // State/Province
      'administrative_area_level_1': { latitudeDelta: 0.2, longitudeDelta: 0.2 }, // Region
      'country': { latitudeDelta: 2.0, longitudeDelta: 2.0 }, // Country level
      'default': { latitudeDelta: 0.0922, longitudeDelta: 0.0421 } // Default zoom
    };
    
    return zoomLevels[locationType] || zoomLevels.default;
  };

  // Enhanced auto-zoom function with smooth animation
  const autoZoomToLocation = async (latitude, longitude, locationType = 'default', animationDuration = 1500) => {
    const zoomLevel = getZoomLevel(locationType);
    const newRegion = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      ...zoomLevel,
    };
    
    console.log(`Auto-zooming to ${locationType} with zoom level:`, zoomLevel);
    
    // Animate to region with specified duration
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, animationDuration);
      setRegion(newRegion);
    }
    
    return newRegion;
  };

  // Enhanced debounced region change handler with configurable delay
  const handleRegionChange = useCallback((newRegion) => {
    setRegion(newRegion);
    
    // Clear existing timeout
    if (regionUpdateTimeoutRef.current) {
      clearTimeout(regionUpdateTimeoutRef.current);
    }
    
    // Clear map region delay timeout
    if (mapRegionDelayRef.current) {
      clearTimeout(mapRegionDelayRef.current);
    }

    // Set timeout for map region data fetch (3 seconds for user interaction)
    mapRegionDelayRef.current = setTimeout(() => {
      const now = Date.now();
      // Only fetch weather if it's been more than 3 seconds since last fetch
      if (!lastWeatherFetchRef.current || (now - lastWeatherFetchRef.current) > 3000) {
        console.log('Fetching weather for map region after 3-second delay');
        lastWeatherFetchRef.current = now;
        handleFetchWeatherData(newRegion.latitude, newRegion.longitude, 'Map Region');
      }
    }, 3000); // 3-second delay for map region changes
    
    // Also set the original timeout for location updates (2 seconds)
    regionUpdateTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      if (!lastWeatherFetchRef.current || (now - lastWeatherFetchRef.current) > 2000) {
        console.log('Fetching weather for location update after 2-second delay');
        lastWeatherFetchRef.current = now;
        handleFetchWeatherData(newRegion.latitude, newRegion.longitude, 'Location Update');
      }
    }, 2000); // 2-second delay for location updates
  }, []);

  // Clean up timeout and location watch on unmount
  useEffect(() => {
    return () => {
      if (regionUpdateTimeoutRef.current) {
        clearTimeout(regionUpdateTimeoutRef.current);
      }
      if (mapRegionDelayRef.current) {
        clearTimeout(mapRegionDelayRef.current);
      }
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, []);

  // Start watching location with 2-second intervals
  const startLocationWatch = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Stop any existing watch
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }

      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 10, // Only if moved more than 10 meters
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          
          // Only update if position has changed significantly
          if (currentUserLocation) {
            const distance = getDistance(
              { latitude: currentUserLocation.latitude, longitude: currentUserLocation.longitude },
              { latitude, longitude }
            );
            
            // Only update if moved more than 50 meters
            if (distance < 50) return;
          }

          console.log('Location updated:', latitude, longitude);
          setCurrentUserLocation({ latitude, longitude });
          
          // Update region with 2-second delay mechanism
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          
          handleRegionChange(newRegion);
        }
      );
    } catch (error) {
      console.log('Location watch error:', error);
    }
  };

  // Calculate distance between two coordinates (in meters)
  const getDistance = (from, to) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (to.latitude - from.latitude) * Math.PI / 180;
    const dLon = (to.longitude - from.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(from.latitude * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user's current location on app start
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setInitializing(false);
        Alert.alert(
          'Permission Required',
          'Location permission is required to show weather for your current location. You can still search for other locations.'
        );
        return;
      }

      // Get initial current location with timeout
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
        timeout: 15000, // 15 second timeout
      });

      const { latitude, longitude } = location.coords;
      setCurrentUserLocation({ latitude, longitude });
      
      // Auto-zoom to current location with city-level zoom
      await autoZoomToLocation(latitude, longitude, 'locality', 2000);
      
      // Fetch weather for current location (initial load, no timeout)
      lastWeatherFetchRef.current = Date.now();
      handleFetchWeatherData(latitude, longitude, 'Your Location');
      
      // Start watching location with 2-second intervals
      startLocationWatch();
      
      setInitializing(false);
    } catch (error) {
      console.log('Location error:', error);
      setInitializing(false);
      Alert.alert('Location Error', 'Unable to get your current location. Please search for a location instead.');
    }
  };

  const selectLocation = async (location) => {
    setSelectedLocation(location);
    setShowLocationSearch(false);
    setShowSearchBar(false);
    
    // Clear any pending region update timeouts
    if (regionUpdateTimeoutRef.current) {
      clearTimeout(regionUpdateTimeoutRef.current);
    }
    if (mapRegionDelayRef.current) {
      clearTimeout(mapRegionDelayRef.current);
    }
    
    // Determine location type for appropriate zoom level
    const locationType = location.type || 'locality';
    
    // Auto-zoom to selected location with appropriate zoom level
    await autoZoomToLocation(location.lat, location.lon, locationType, 1500);
    
    // Fetch weather data immediately for user-selected location
    lastWeatherFetchRef.current = Date.now();
    await handleFetchWeatherData(location.lat, location.lon, location.name);
  };

  const handleFetchWeatherData = async (lat, lon, locationName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeatherData(lat, lon, locationName);
      // Add current time and date to weather data
      const now = new Date();
      const enhancedData = {
        ...data,
        currentTime: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        currentDate: now.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        lastUpdated: now.toLocaleTimeString()
      };
      setWeatherData(enhancedData);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setError('Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const customLocation = {
      name: `Custom Location`,
      lat: latitude,
      lon: longitude
    };
    
    // Clear any pending region update timeouts
    if (regionUpdateTimeoutRef.current) {
      clearTimeout(regionUpdateTimeoutRef.current);
    }
    if (mapRegionDelayRef.current) {
      clearTimeout(mapRegionDelayRef.current);
    }
    
    setSelectedLocation(customLocation);
    
    // Auto-zoom to tapped location with street level zoom
    await autoZoomToLocation(latitude, longitude, 'route', 1200);
    
    // Fetch weather data immediately for user tap
    lastWeatherFetchRef.current = Date.now();
    await handleFetchWeatherData(latitude, longitude, 'Custom Location');
  };

  const handleCurrentLocationPress = () => {
    setShowLocationSearch(false);
    setShowSearchBar(false);
    
    // Clear any pending region update timeouts
    if (regionUpdateTimeoutRef.current) {
      clearTimeout(regionUpdateTimeoutRef.current);
    }
    if (mapRegionDelayRef.current) {
      clearTimeout(mapRegionDelayRef.current);
    }
    
    getCurrentLocation();
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'satellite' ? 'standard' : 'satellite');
  };

  // Handle search result selection
  const handleSearchLocationSelect = async (location) => {
    const searchLocation = {
      name: location.name || location.address,
      lat: location.latitude,
      lon: location.longitude,
      type: location.type
    };
    
    setSelectedLocation(searchLocation);
    setShowSearchBar(false);
    
    // Clear any pending timeouts
    if (regionUpdateTimeoutRef.current) {
      clearTimeout(regionUpdateTimeoutRef.current);
    }
    if (mapRegionDelayRef.current) {
      clearTimeout(mapRegionDelayRef.current);
    }
    
    // Determine appropriate zoom level based on location type
    const locationType = location.type || 'locality';
    console.log('Search location type:', locationType);
    
    // Auto-zoom to selected location with enhanced zoom
    await autoZoomToLocation(location.latitude, location.longitude, locationType, 1800);
    
    // Fetch weather data immediately for search result
    lastWeatherFetchRef.current = Date.now();
    await handleFetchWeatherData(location.latitude, location.longitude, location.name || location.address);
  };

  // Create markers for map
  const createMapMarkers = () => {
    const markers = [];
    
    // Add selected location marker if exists
    if (selectedLocation) {
      markers.push({
        coordinate: { latitude: selectedLocation.lat, longitude: selectedLocation.lon },
        title: selectedLocation.name,
        description: 'Selected Location',
        key: 'selected',
      });
    }

    // Add current location marker if available
    if (currentUserLocation) {
      markers.push({
        coordinate: currentUserLocation,
        title: 'Your Location',
        description: 'Current position',
        key: 'current-location',
      });
    }

    return markers;
  };

  if (initializing) {
    return <LoadingScreen message="Initializing ForeTrip..." />;
  }

  return (
    <View style={weatherStyles.container} pointerEvents="box-none">
      <StatusBar backgroundColor="#0A0E1A" barStyle="light-content" />
      
      <NASAMapView
        ref={mapRef}
        region={region}
        onRegionChange={handleRegionChange}
        onPress={onMapPress}
        markers={createMapMarkers()}
        mapType={mapType}
      />

      <WeatherCard 
        weatherData={weatherData}
        loading={loading}
        error={error}
      />

      <CompactSearchBar
        visible={showSearchBar}
        onLocationSelect={handleSearchLocationSelect}
        onClose={() => setShowSearchBar(false)}
      />

      {/* Unified Control Bar */}
      {!showLocationSearch && !showSearchBar && (
        <View style={{ 
          position: 'absolute', 
          bottom: 30, 
          left: 20, 
          right: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 25, 45, 0.9)',
          borderRadius: 25,
          paddingHorizontal: 15,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: 'rgba(0, 212, 170, 0.3)',
          shadowColor: '#00D4AA',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }} 
        pointerEvents="box-none">
          
          {/* Map Type Toggle */}
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(0, 212, 170, 0.2)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: 'rgba(0, 212, 170, 0.5)',
            }}
            onPress={toggleMapType}
          >
            <Text style={{ color: '#00D4AA', fontSize: 12, fontWeight: '600' }}>
              {mapType === 'satellite' ? '🛰️ Satellite' : '🗺️ Street'}
            </Text>
          </TouchableOpacity>

          {/* Search Button */}
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255, 230, 109, 0.2)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 230, 109, 0.5)',
            }}
            onPress={() => setShowSearchBar(true)}
          >
            <Text style={{ color: '#FFE66D', fontSize: 12, fontWeight: '600' }}>
              🔍 Search
            </Text>
          </TouchableOpacity>

          {/* Current Location Button */}
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255, 107, 107, 0.2)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 107, 107, 0.5)',
            }}
            onPress={handleCurrentLocationPress}
          >
            <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600' }}>
              📍 Location
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default WeatherApp;