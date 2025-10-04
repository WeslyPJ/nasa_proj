// API Configuration
export const API_BASE_URL = 'http://localhost:8001';

// Popular tourist destinations with coordinates
export const POPULAR_LOCATIONS = [
  { name: 'New York City', lat: 40.7128, lon: -74.0060, country: 'USA', icon: '🗽' },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK', icon: '🏰' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France', icon: '🗼' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan', icon: '🏯' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'Australia', icon: '🏖️' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE', icon: '🕌' },
  { name: 'Rome', lat: 41.9028, lon: 12.4964, country: 'Italy', icon: '🏛️' },
  { name: 'Barcelona', lat: 41.3851, lon: 2.1734, country: 'Spain', icon: '🏖️' },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018, country: 'Thailand', icon: '🏯' },
  { name: 'Miami', lat: 25.7617, lon: -80.1918, country: 'USA', icon: '🌴' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA', icon: '🌟' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'Singapore', icon: '🦁' },
];

// Weather condition configurations
export const WEATHER_CONDITIONS = {
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

// Default map region
export const DEFAULT_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Animation durations
export const ANIMATION_DURATION = 2000;
export const MAP_ANIMATION_DURATION = 1000;