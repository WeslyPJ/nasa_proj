import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { requestLocationPermission, locationPermissionConfig } from './locationUtils';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://localhost:8001';

// Popular tourist spots with coordinates
const POPULAR_LOCATIONS = [
  { name: 'New York City', lat: 40.7128, lon: -74.0060, country: 'USA' },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'Australia' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE' },
  { name: 'Rome', lat: 41.9028, lon: 12.4964, country: 'Italy' },
  { name: 'Barcelona', lat: 41.3851, lon: 2.1734, country: 'Spain' },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018, country: 'Thailand' },
  { name: 'Miami', lat: 25.7617, lon: -80.1918, country: 'USA' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'Singapore' },
];

// Weather condition animations and colors
const WEATHER_CONDITIONS = {
  clear: { 
    colors: ['#87CEEB', '#4169E1'], 
    animation: 'pulse',
    icon: 'wb-sunny',
    description: 'Clear skies'
  },
  rain: { 
    colors: ['#4682B4', '#2F4F4F'], 
    animation: 'bounce',
    icon: 'grain',
    description: 'Rainy weather'
  },
  cloudy: { 
    colors: ['#708090', '#2F4F4F'], 
    animation: 'fadeIn',
    icon: 'cloud',
    description: 'Cloudy skies'
  },
  hot: { 
    colors: ['#FF6347', '#FF4500'], 
    animation: 'flash',
    icon: 'wb-sunny',
    description: 'Hot weather'
  },
  cold: { 
    colors: ['#4169E1', '#191970'], 
    animation: 'pulse',
    icon: 'ac-unit',
    description: 'Cold weather'
  }
};

const WeatherApp = () => {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const mapRef = useRef(null);

  // Get user's current location on app start
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentUserLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        
        // Fetch weather for current location
        fetchWeatherData(latitude, longitude, 'Your Location');
      },
      (error) => {
        console.log('Location error:', error);
        Alert.alert('Location Error', 'Unable to get your current location. Please search for a location instead.');
      },
      locationPermissionConfig
    );
  };

  const searchLocations = (query) => {
    const filtered = POPULAR_LOCATIONS.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.country.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setShowSearchResults(filtered.length > 0);
  };

  const selectLocation = async (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setShowSearchResults(false);
    
    // Animate map to selected location
    const newRegion = {
      latitude: location.lat,
      longitude: location.lon,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    
    // Fetch weather data
    await fetchWeatherData(location.lat, location.lon, location.name);
  };

  const fetchWeatherData = async (lat, lon, locationName) => {
    setLoading(true);
    try {
      // Use the new unified weather endpoint
      const response = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(locationName)}`);
      const weatherData = await response.json();

      // Process the comprehensive weather data
      const processedWeatherData = {
        location: locationName,
        coordinates: { lat, lon },
        temperature: weatherData.current.temperature,
        feelsLike: weatherData.current.temperature_feels_like,
        precipitation: weatherData.current.precipitation,
        precipitation24h: weatherData.current.precipitation_24h,
        humidity: weatherData.current.humidity,
        windSpeed: weatherData.current.wind_speed,
        windDirection: weatherData.current.wind_direction,
        cloudCover: weatherData.current.cloud_cover,
        uvIndex: weatherData.current.uv_index,
        visibility: weatherData.current.visibility,
        pressure: weatherData.current.pressure,
        condition: weatherData.current.condition,
        lastUpdated: new Date().toLocaleTimeString(),
        forecast: weatherData.forecast || [],
        satellite: {
          modis: weatherData.satellite_data.modis.available,
          gpm: weatherData.satellite_data.gpm.available
        }
      };

      setWeatherData(processedWeatherData);
    } catch (error) {
      console.error('Weather fetch error:', error);
      Alert.alert('Error', 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherCondition = (temperature, precipitation) => {
    if (precipitation > 2) return 'rain';
    if (temperature > 303) return 'hot'; // > 30°C
    if (temperature < 283) return 'cold'; // < 10°C
    if (Math.random() > 0.5) return 'cloudy';
    return 'clear';
  };

  const onMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const customLocation = {
      name: `Custom Location`,
      lat: latitude,
      lon: longitude
    };
    
    setSelectedLocation(customLocation);
    setSearchQuery(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    await fetchWeatherData(latitude, longitude, 'Custom Location');
  };

  const renderWeatherCard = () => {
    if (!weatherData) return null;

    const condition = WEATHER_CONDITIONS[weatherData.condition] || WEATHER_CONDITIONS.clear;

    return (
      <Animatable.View 
        animation={condition.animation}
        duration={2000}
        iterationCount="infinite"
        style={styles.weatherCard}
      >
        <LinearGradient
          colors={condition.colors}
          style={styles.weatherGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.weatherHeader}>
            <Text style={styles.locationName}>{weatherData.location}</Text>
            <Text style={styles.lastUpdated}>Updated: {weatherData.lastUpdated}</Text>
          </View>

          <View style={styles.weatherMain}>
            <View style={styles.temperatureSection}>
              <Icon name={condition.icon} size={60} color="#FFFFFF" />
              <Text style={styles.temperature}>{weatherData.temperature}°C</Text>
            </View>
            <Text style={styles.weatherDescription}>{condition.description}</Text>
          </View>

          <View style={styles.weatherDetails}>
            <View style={styles.detailItem}>
              <Icon name="opacity" size={20} color="#FFFFFF" />
              <Text style={styles.detailText}>Precipitation</Text>
              <Text style={styles.detailValue}>{weatherData.precipitation.toFixed(1)} mm</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="water-drop" size={20} color="#FFFFFF" />
              <Text style={styles.detailText}>Humidity</Text>
              <Text style={styles.detailValue}>{weatherData.humidity}%</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="air" size={20} color="#FFFFFF" />
              <Text style={styles.detailText}>Wind</Text>
              <Text style={styles.detailValue}>{weatherData.windSpeed} km/h</Text>
            </View>
          </View>

          <View style={styles.additionalDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="thermostat" size={16} color="#E0E0E0" />
                <Text style={styles.smallDetailText}>Feels like {weatherData.feelsLike}°C</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="visibility" size={16} color="#E0E0E0" />
                <Text style={styles.smallDetailText}>{weatherData.visibility} km</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="compress" size={16} color="#E0E0E0" />
                <Text style={styles.smallDetailText}>{weatherData.pressure} hPa</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="wb-sunny" size={16} color="#E0E0E0" />
                <Text style={styles.smallDetailText}>UV {weatherData.uvIndex}</Text>
              </View>
            </View>
          </View>

          <View style={styles.satelliteInfo}>
            <Text style={styles.satelliteTitle}>NASA Satellite Data</Text>
            <View style={styles.satelliteStatus}>
              <View style={[styles.statusDot, { backgroundColor: weatherData.satellite.modis ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.satelliteText}>MODIS: {weatherData.satellite.modis ? 'Active' : 'Offline'}</Text>
            </View>
            <View style={styles.satelliteStatus}>
              <View style={[styles.statusDot, { backgroundColor: weatherData.satellite.gpm ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.satelliteText}>GPM: {weatherData.satellite.gpm ? 'Active' : 'Offline'}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2196F3" barStyle="light-content" />
      
      {/* Header with search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for cities or tourist spots..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length > 2) {
                searchLocations(text);
              } else {
                setShowSearchResults(false);
              }
            }}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setShowSearchResults(false);
            }}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
          <Icon name="my-location" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Search Results Dropdown */}
      {showSearchResults && (
        <Animatable.View animation="slideInDown" style={styles.searchResults}>
          <ScrollView style={styles.searchResultsList}>
            {searchResults.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.searchResultItem}
                onPress={() => selectLocation(location)}
              >
                <Icon name="place" size={20} color="#2196F3" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationCountry}>{location.country}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animatable.View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onPress={onMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="standard"
      >
        {/* Popular locations markers */}
        {POPULAR_LOCATIONS.map((location, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: location.lat, longitude: location.lon }}
            title={location.name}
            description={location.country}
            onPress={() => selectLocation(location)}
          >
            <View style={styles.customMarker}>
              <Icon name="place" size={30} color="#FF5722" />
            </View>
          </Marker>
        ))}

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker
            coordinate={{ latitude: selectedLocation.lat, longitude: selectedLocation.lon }}
            title={selectedLocation.name}
          >
            <Animatable.View animation="bounce" iterationCount="infinite" style={styles.selectedMarker}>
              <Icon name="location-on" size={40} color="#2196F3" />
            </Animatable.View>
          </Marker>
        )}
      </MapView>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Fetching NASA satellite data...</Text>
        </View>
      )}

      {/* Weather Card */}
      {renderWeatherCard()}

      {/* Popular Locations Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <Text style={styles.bottomSheetTitle}>Popular Tourist Destinations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularLocations}>
          {POPULAR_LOCATIONS.slice(0, 6).map((location, index) => (
            <TouchableOpacity
              key={index}
              style={styles.popularLocationCard}
              onPress={() => selectLocation(location)}
            >
              <LinearGradient
                colors={['#2196F3', '#21CBF3']}
                style={styles.popularLocationGradient}
              >
                <Icon name="place" size={24} color="#FFFFFF" />
                <Text style={styles.popularLocationName}>{location.name}</Text>
                <Text style={styles.popularLocationCountry}>{location.country}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  locationButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    maxHeight: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 2000,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationInfo: {
    marginLeft: 15,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationCountry: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
  },
  selectedMarker: {
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  weatherCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1500,
  },
  weatherGradient: {
    borderRadius: 20,
    padding: 20,
  },
  weatherHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  lastUpdated: {
    color: '#E0E0E0',
    fontSize: 12,
    marginTop: 5,
  },
  weatherMain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  temperatureSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 15,
  },
  weatherDescription: {
    fontSize: 18,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  additionalDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    color: '#E0E0E0',
    fontSize: 12,
    marginTop: 5,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  smallDetailText: {
    color: '#E0E0E0',
    fontSize: 11,
    marginLeft: 4,
  },
  satelliteInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    paddingTop: 15,
  },
  satelliteTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  satelliteStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  satelliteText: {
    color: '#E0E0E0',
    fontSize: 12,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  popularLocations: {
    flexDirection: 'row',
  },
  popularLocationCard: {
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  popularLocationGradient: {
    width: 120,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  popularLocationName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },
  popularLocationCountry: {
    color: '#E0E0E0',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default WeatherApp;