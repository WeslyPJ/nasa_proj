import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StatusBar, Alert, TouchableOpacity, Text } from 'react-native';
import { WeatherCard, LocationSearch, LoadingScreen, NASAMapView, CompactSearchBar, NetworkStatus, DatePicker, PlaceSearch } from './src/components';
import { fetchWeatherData } from './src/utils/apiUtils';
import { POPULAR_LOCATIONS, API_BASE_URL } from './src/constants';
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
  const [delayStatus, setDelayStatus] = useState({ mapRegion: false, location: false });
  const [lastLocationFetch, setLastLocationFetch] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null); // For date picker
  const [showPlaceSearch, setShowPlaceSearch] = useState(false); // For place search modal
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

  // Enhanced auto-zoom function with immediate weather data fetch
  const autoZoomToLocation = async (latitude, longitude, locationType = 'default', animationDuration = 1500, fetchWeather = true) => {
    const zoomLevel = getZoomLevel(locationType);
    const newRegion = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      ...zoomLevel,
    };
    
    console.log(`Auto-zooming to ${locationType} with zoom level:`, zoomLevel);
    
    // Show loading immediately if fetching weather
    if (fetchWeather) {
      setLoading(true);
      setError(null);
    }
    
    // Animate to region with specified duration
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, animationDuration);
      setRegion(newRegion);
    }
    
    // Immediately fetch weather data if requested
    if (fetchWeather) {
      console.log('Fetching weather data immediately after zoom');
      lastWeatherFetchRef.current = Date.now();
      await handleFetchWeatherData(latitude, longitude, 'Auto-Zoom Location');
    }
    
    return newRegion;
  };

  // Enhanced debounced region change handler with zoom protection
  const handleRegionChange = useCallback((newRegion) => {
    // Check if zoomed very close (potential drift zone)
    const isVeryZoomed = newRegion.latitudeDelta < 0.001 || newRegion.longitudeDelta < 0.001;
    
    if (isVeryZoomed) {
      console.log('🔍 Map is zoomed very close, reducing update frequency to prevent drift');
      setRegion(newRegion); // Still update the region state but don't trigger weather updates
      return;
    }

    setRegion(newRegion);
    
    // Clear existing timeouts
    if (regionUpdateTimeoutRef.current) {
      clearTimeout(regionUpdateTimeoutRef.current);
    }
    if (mapRegionDelayRef.current) {
      clearTimeout(mapRegionDelayRef.current);
    }

    // Show delay status
    setDelayStatus({ mapRegion: true, location: true });

    // Set timeout for map region data fetch (5 seconds for zoomed regions to reduce drift)
    const delayTime = isVeryZoomed ? 8000 : 3000; // Longer delay when zoomed close
    
    mapRegionDelayRef.current = setTimeout(() => {
      const now = Date.now();
      if (!lastWeatherFetchRef.current || (now - lastWeatherFetchRef.current) > delayTime) {
        console.log(`Fetching weather for map region after ${delayTime/1000}-second delay`);
        lastWeatherFetchRef.current = now;
        handleFetchWeatherData(newRegion.latitude, newRegion.longitude, 'Map Region');
      }
      setDelayStatus(prev => ({ ...prev, mapRegion: false }));
    }, delayTime);
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

  // Start watching location with 2-second intervals (React Native compatible)
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
          timeInterval: 2000,
          distanceInterval: 10,
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          
          // Only update if position has changed significantly
          if (currentUserLocation) {
            const distance = getDistance(
              currentUserLocation,
              { latitude, longitude }
            );
            
            if (distance < 50) return; // Less than 50 meters, ignore
          }

          console.log('Location updated:', latitude, longitude);
          setCurrentUserLocation({ latitude, longitude });
          
          // Update region with delay mechanism
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
    // Check API connectivity first
    checkApiConnectivity();
    getCurrentLocation();
  }, []);

  // Check API connectivity
  const checkApiConnectivity = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (response.ok) {
        console.log('✅ API connectivity check passed');
      } else {
        console.warn('⚠️ API returned non-OK status:', response.status);
      }
    } catch (error) {
      console.error('❌ API connectivity check failed:', error);
      Alert.alert(
        'Backend Connection Issue',
        `Cannot connect to the weather API backend. Please ensure the backend server is running on ${API_BASE_URL}.`,
        [{ text: 'OK' }]
      );
    }
  };

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
      
      // Auto-zoom to current location with city-level zoom and immediate weather fetch
      await autoZoomToLocation(latitude, longitude, 'locality', 2000, true);
      
      // Start watching location with 2-second intervals
      startLocationWatch();
      
      setInitializing(false);
    } catch (error) {
      console.log('Location error:', error);
      setInitializing(false);
      Alert.alert('Location Error', 'Unable to get your current location. Please search for a location instead.');
    }
  };

  // Unified location selection handler
  const selectLocationAndFetchWeather = async (lat, lon, name, locationType = 'locality', animationDuration = 1500) => {
    // Clear any pending timeouts
    if (regionUpdateTimeoutRef.current) {
      clearTimeout(regionUpdateTimeoutRef.current);
    }
    if (mapRegionDelayRef.current) {
      clearTimeout(mapRegionDelayRef.current);
    }
    
    // Reset delay status
    setDelayStatus({ mapRegion: false, location: false });
    
    // Set selected location
    setSelectedLocation({ name, lat, lon, type: locationType });
    
    // Auto-zoom and fetch weather immediately
    await autoZoomToLocation(lat, lon, locationType, animationDuration, true);
  };

  const selectLocation = async (location) => {
    setShowLocationSearch(false);
    setShowSearchBar(false);
    
    const locationType = location.type || 'locality';
    await selectLocationAndFetchWeather(location.lat, location.lon, location.name, locationType, 1500);
  };

  const handleFetchWeatherData = async (lat, lon, locationName, forceUpdate = false) => {
    // Implement 10-second throttling to prevent excessive API calls
    const now = Date.now();
    const timeSinceLastFetch = now - lastLocationFetch;
    
    if (!forceUpdate && timeSinceLastFetch < 10000) { // 10 seconds = 10000ms
      console.log(`⏱️ Throttling: ${(10000 - timeSinceLastFetch) / 1000}s remaining before next fetch`);
      return;
    }
    
    setLastLocationFetch(now);
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching weather data for: ${locationName} (${lat}, ${lon})`);
      
      // Add date parameter if selected
      const data = await fetchWeatherData(lat, lon, locationName, selectedDate);
      console.log('Weather data received:', data);
      
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
      console.log('Weather data updated successfully');
    } catch (error) {
      console.error('Weather fetch error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fetch weather data. ';
      if (error.message.includes('Failed to fetch')) {
        errorMessage += `Network connection issue. Please check if the backend is running on ${API_BASE_URL}.`;
      } else if (error.message.includes('HTTP error! status: 404')) {
        errorMessage += 'Weather endpoint not found. Please check the API configuration.';
      } else if (error.message.includes('HTTP error! status: 500')) {
        errorMessage += 'Server error. Please check the backend logs.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onMapPress = async (event) => {
    // Extract coordinate immediately to avoid synthetic event issues
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Reset delay status
    setDelayStatus({ mapRegion: false, location: false });
    
    // Auto-zoom to tapped location with immediate weather fetch
    await selectLocationAndFetchWeather(latitude, longitude, 'Custom Location', 'route', 1200);
  };

  const handlePlaceSelect = async (place) => {
    try {
      console.log('Place selected:', place);
      
      // Auto-zoom to selected place with immediate weather fetch
      await selectLocationAndFetchWeather(
        place.latitude, 
        place.longitude, 
        place.name || place.city, 
        'locality', 
        1200
      );
      
      setShowPlaceSearch(false);
    } catch (error) {
      console.error('Error selecting place:', error);
      Alert.alert('Error', 'Failed to select location. Please try again.');
    }
  };

  const handleCurrentLocationPress = async () => {
    setShowLocationSearch(false);
    setShowSearchBar(false);
    
    // Clear any pending timeouts and reset delay status
    if (regionUpdateTimeoutRef.current) {
      clearTimeout(regionUpdateTimeoutRef.current);
    }
    if (mapRegionDelayRef.current) {
      clearTimeout(mapRegionDelayRef.current);
    }
    setDelayStatus({ mapRegion: false, location: false });
    
    await getCurrentLocation();
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'satellite' ? 'standard' : 'satellite');
  };

  // Handle search result selection
  const handleSearchLocationSelect = async (location) => {
    setShowSearchBar(false);
    
    const locationType = location.type || 'locality';
    console.log('Search location type:', locationType);
    
    await selectLocationAndFetchWeather(
      location.latitude, 
      location.longitude, 
      location.name || location.address, 
      locationType, 
      1800
    );
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

      {/* Network Status Indicator */}
      <NetworkStatus />

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
            onPress={() => setShowPlaceSearch(true)}
          >
            <Text style={{ color: '#FFE66D', fontSize: 12, fontWeight: '600' }}>
              🔍 Places
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
      
      {/* Date Picker for Forecast */}
      <View style={{ 
        position: 'absolute', 
        top: 80, 
        right: 20,
        width: 140,
      }}>
        <DatePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </View>
      
      {/* Place Search Modal */}
      <PlaceSearch
        visible={showPlaceSearch}
        onClose={() => setShowPlaceSearch(false)}
        onPlaceSelect={handlePlaceSelect}
      />
    </View>
  );
};

export default WeatherApp;