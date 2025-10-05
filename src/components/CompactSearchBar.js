import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, ActivityIndicator, Alert } from 'react-native';

// Local database of popular locations as fallback
const popularLocations = [
  { id: '1', name: 'New York City', lat: 40.7128, lon: -74.0060, country: 'USA', type: 'city' },
  { id: '2', name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK', type: 'city' },
  { id: '3', name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France', type: 'city' },
  { id: '4', name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan', type: 'city' },
  { id: '5', name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'Australia', type: 'city' },
  { id: '6', name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE', type: 'city' },
  { id: '7', name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA', type: 'city' },
  { id: '8', name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'Singapore', type: 'city' },
  { id: '9', name: 'Hong Kong', lat: 22.3193, lon: 114.1694, country: 'China', type: 'city' },
  { id: '10', name: 'Barcelona', lat: 41.3851, lon: 2.1734, country: 'Spain', type: 'city' },
  { id: '11', name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'India', type: 'city' },
  { id: '12', name: 'São Paulo', lat: -23.5505, lon: -46.6333, country: 'Brazil', type: 'city' },
  { id: '13', name: 'Cairo', lat: 30.0444, lon: 31.2357, country: 'Egypt', type: 'city' },
  { id: '14', name: 'Moscow', lat: 55.7558, lon: 37.6176, country: 'Russia', type: 'city' },
  { id: '15', name: 'Seoul', lat: 37.5665, lon: 126.9780, country: 'South Korea', type: 'city' },
  { id: '16', name: 'Bangkok', lat: 13.7563, lon: 100.5018, country: 'Thailand', type: 'city' },
  { id: '17', name: 'Istanbul', lat: 41.0082, lon: 28.9784, country: 'Turkey', type: 'city' },
  { id: '18', name: 'Mexico City', lat: 19.4326, lon: -99.1332, country: 'Mexico', type: 'city' },
  { id: '19', name: 'Cape Town', lat: -33.9249, lon: 18.4241, country: 'South Africa', type: 'city' },
  { id: '20', name: 'Miami', lat: 25.7617, lon: -80.1918, country: 'USA', type: 'city' },
];

const CompactSearchBar = ({ visible, onLocationSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [useLocalSearch, setUseLocalSearch] = useState(false);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  if (!visible) return null;

  // Google Geocoding API function with enhanced location types
  const searchGooglePlaces = async (query) => {
    try {
      // You can replace this with your Google API key
      const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
      
      // Using Google Places API Text Search
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`,
        {
          signal: abortControllerRef.current?.signal,
          headers: {
            'User-Agent': 'ForeTrip/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.results.map(item => {
          // Map Google Place types to our zoom levels
          const getPrimaryType = (types) => {
            const typeMapping = {
              'street_address': 'street_address',
              'route': 'route',
              'neighborhood': 'neighborhood',
              'sublocality': 'neighborhood',
              'locality': 'locality',
              'administrative_area_level_3': 'administrative_area_level_3',
              'administrative_area_level_2': 'administrative_area_level_2',
              'administrative_area_level_1': 'administrative_area_level_1',
              'country': 'country',
              'establishment': 'route',
              'point_of_interest': 'route',
              'tourist_attraction': 'route'
            };
            
            // Find the most specific type available
            for (const type of types) {
              if (typeMapping[type]) {
                return typeMapping[type];
              }
            }
            return 'locality'; // Default to city level
          };

          return {
            id: item.place_id,
            place_id: item.place_id,
            lat: item.geometry.location.lat.toString(),
            lon: item.geometry.location.lng.toString(),
            display_name: item.formatted_address,
            name: item.name,
            type: getPrimaryType(item.types),
            originalTypes: item.types,
            rating: item.rating,
            user_ratings_total: item.user_ratings_total
          };
        });
      } else {
        throw new Error(`Google API Error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Google Places API failed:', error.message);
      throw error;
    }
  };

  // OpenStreetMap Nominatim fallback with enhanced location types
  const searchNominatim = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
        { 
          signal: abortControllerRef.current?.signal,
          headers: {
            'User-Agent': 'ForeTrip/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.map(item => {
          // Map OSM types to our zoom levels
          const mapOSMType = (osmType, osmClass) => {
            const typeMapping = {
              'house': 'street_address',
              'building': 'route',
              'highway': 'route',
              'amenity': 'route',
              'shop': 'route',
              'tourism': 'route',
              'leisure': 'route',
              'suburb': 'neighborhood',
              'neighbourhood': 'neighborhood',
              'city': 'locality',
              'town': 'locality',
              'village': 'locality',
              'hamlet': 'locality',
              'county': 'administrative_area_level_3',
              'state': 'administrative_area_level_1',
              'country': 'country'
            };
            
            return typeMapping[osmType] || typeMapping[osmClass] || 'locality';
          };

          return {
            ...item,
            id: item.place_id || Math.random().toString(),
            type: mapOSMType(item.type, item.class),
            originalType: item.type,
            originalClass: item.class
          };
        });
      } else {
        throw new Error(`Nominatim Error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Nominatim API failed:', error.message);
      throw error;
    }
  };
  const searchLocalLocations = (query) => {
    const filtered = popularLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.country.toLowerCase().includes(query.toLowerCase())
    );
    return filtered.map(location => ({
      id: location.id,
      lat: location.lat.toString(),
      lon: location.lon.toString(),
      display_name: `${location.name}, ${location.country}`,
      name: location.name,
      type: 'locality', // Cities get city-level zoom
      place_id: location.id,
      country: location.country
    }));
  };

  // Enhanced geocoding function with Google API priority and 2-second debounce
  const searchLocation = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoading(true);
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      let results = [];

      // First try Google Places API (if available)
      if (!useLocalSearch) {
        try {
          console.log('Searching with Google Places API...');
          results = await searchGooglePlaces(query);
          console.log('Google Places results:', results.length);
        } catch (googleError) {
          console.log('Google Places failed, trying Nominatim...');
          // Fallback to Nominatim
          try {
            results = await searchNominatim(query);
            console.log('Nominatim results:', results.length);
          } catch (nominatimError) {
            console.log('Both online services failed, using local search');
            setUseLocalSearch(true);
            results = searchLocalLocations(query);
          }
        }
      } else {
        // Use local search only
        results = searchLocalLocations(query);
      }

      // If no results from any online service, try local
      if (results.length === 0 && !useLocalSearch) {
        console.log('No online results, trying local search...');
        results = searchLocalLocations(query);
        if (results.length === 0) {
          setUseLocalSearch(true);
        }
      }

      setSearchResults(results);
      setShowResults(true);

      if (results.length === 0 && !useLocalSearch) {
        setTimeout(() => {
          Alert.alert(
            'No Results',
            'No locations found. Try searching for cities, landmarks, or addresses.',
            [
              { text: 'Search Offline', onPress: () => setUseLocalSearch(true) },
              { text: 'OK' }
            ]
          );
        }, 100);
      }

    } catch (error) {
      console.warn('Search failed:', error.message);
      if (error.name !== 'AbortError') {
        // Fall back to local search
        const localResults = searchLocalLocations(query);
        setSearchResults(localResults);
        setShowResults(true);
        setUseLocalSearch(true);
        
        setTimeout(() => {
          Alert.alert(
            'Network Issue',
            'Unable to search online. Showing popular destinations instead.',
            [{ text: 'OK' }]
          );
        }, 100);
      }
    }
    
    setLoading(false);
  }, [useLocalSearch]);

  // Handle location selection with enhanced data
  const handleLocationSelect = (location) => {
    const locationData = {
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      name: location.name || location.display_name.split(',')[0],
      address: location.display_name,
      rating: location.rating,
      user_ratings_total: location.user_ratings_total,
      type: location.type
    };
    
    // Clear search state
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setLoading(false);
    
    // Clear any pending timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    console.log('Selected location:', locationData);
    onLocationSelect(locationData);
    onClose();
  };

  // Get appropriate icon for location type
  const getLocationIcon = (type) => {
    const iconMap = {
      city: '🏙️',
      town: '🏘️',
      village: '🏡',
      country: '🗺️',
      state: '📍',
      landmark: '🏛️',
      monument: '🗿',
      building: '🏢',
      airport: '✈️',
      park: '🌳',
      mountain: '⛰️',
      lake: '🌊',
      restaurant: '🍽️',
      hotel: '🏨',
      school: '🏫',
      hospital: '🏥',
      church: '⛪',
      museum: '🏛️',
      stadium: '🏟️',
      bridge: '🌉',
      default: '📍'
    };
    return iconMap[type] || iconMap.default;
  };

  // Format address for display
  const formatLocationAddress = (displayName) => {
    const parts = displayName.split(',');
    if (parts.length > 3) {
      return parts.slice(1, 4).join(', ');
    }
    return parts.slice(1).join(', ');
  };

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (text.length === 0) {
      setSearchResults([]);
      setShowResults(false);
      setLoading(false);
    } else if (text.length >= 2) {
      // Show loading immediately
      setLoading(true);
      
      // Search with 2-second debounce
      searchTimeoutRef.current = setTimeout(() => {
        console.log('Searching after 2-second delay:', text);
        searchLocation(text);
      }, 2000);
    }
  }, [searchLocation]);

  // Cleanup function
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <View style={{
      position: 'absolute',
      top: 120, // Below compact weather card
      left: 15,
      right: 15,
      zIndex: 900,
      elevation: 5,
    }}
    pointerEvents="box-none"
    >
      {/* Compact Search Input */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: useLocalSearch ? '#FF6B6B' : '#00F5FF',
        shadowColor: useLocalSearch ? '#FF6B6B' : '#00F5FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }}>
        <TextInput
          style={{
            flex: 1,
            padding: 12,
            color: '#FFFFFF',
            fontSize: 14,
          }}
          placeholder={useLocalSearch ? "🔍 Search popular places..." : "🔍 Search places (2s delay)..."}
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {useLocalSearch && (
          <TouchableOpacity
            style={{
              padding: 6,
              marginRight: 5,
              backgroundColor: 'rgba(255, 107, 107, 0.2)',
              borderRadius: 10,
            }}
            onPress={() => {
              setUseLocalSearch(false);
              Alert.alert(
                'Network Mode',
                'Switched back to online search. Try searching again.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={{ color: '#FF6B6B', fontSize: 10 }}>📶</Text>
          </TouchableOpacity>
        )}
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={{
              padding: 8,
              marginRight: 5,
            }}
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowResults(false);
              onClose();
            }}
          >
            <Text style={{ color: '#FF6B6B', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
        {loading && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 12,
          }}>
            <ActivityIndicator 
              size="small" 
              color="#00D4AA" 
              style={{ marginRight: 4 }}
            />
            <Text style={{ 
              color: '#00D4AA', 
              fontSize: 10,
              fontWeight: '600'
            }}>
              2s
            </Text>
          </View>
        )}
      </View>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <View style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          marginTop: 5,
          borderRadius: 15,
          maxHeight: 200,
          borderWidth: 1,
          borderColor: '#00D4AA',
          elevation: 3,
          shadowColor: '#00D4AA',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}>
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${item.place_id || index}`}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={{
                  padding: 12,
                  borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(0, 212, 170, 0.2)',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => handleLocationSelect(item)}
              >
                <Text style={{
                  fontSize: 16,
                  marginRight: 8,
                  color: '#FF6B9D',
                }}>
                  {getLocationIcon(item.type)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    {item.name || item.display_name.split(',')[0]}
                  </Text>
                  <Text style={{
                    color: '#A0A0A0',
                    fontSize: 12,
                    marginTop: 2,
                  }}>
                    {formatLocationAddress(item.display_name)}
                  </Text>
                  {item.rating && (
                    <Text style={{
                      color: '#FFD700',
                      fontSize: 11,
                      marginTop: 1,
                    }}>
                      ⭐ {item.rating} {item.user_ratings_total ? `(${item.user_ratings_total})` : ''}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* No Results Message */}
      {showResults && searchResults.length === 0 && !loading && searchQuery.length >= 2 && (
        <View style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          marginTop: 5,
          borderRadius: 15,
          padding: 15,
          borderWidth: 1,
          borderColor: '#FF6B6B',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '600' }}>
            🚫 No locations found
          </Text>
          <Text style={{ color: '#A0A0A0', fontSize: 12, marginTop: 5, textAlign: 'center' }}>
            {useLocalSearch ? 'Try searching for popular cities' : 'Try searching for cities, landmarks, or addresses'}
          </Text>
          {!useLocalSearch && (
            <TouchableOpacity
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: 'rgba(0, 212, 170, 0.2)',
                borderRadius: 10,
              }}
              onPress={() => {
                setUseLocalSearch(true);
                searchLocation(searchQuery);
              }}
            >
              <Text style={{ color: '#00D4AA', fontSize: 12 }}>
                📱 Search offline
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Network Status and Search Method Indicator */}
      {useLocalSearch && (
        <View style={{
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          marginTop: 5,
          borderRadius: 10,
          padding: 8,
          borderWidth: 1,
          borderColor: 'rgba(255, 107, 107, 0.3)',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#FF6B6B', fontSize: 11, textAlign: 'center' }}>
            📶 Offline mode - Popular destinations only
          </Text>
        </View>
      )}

      {!useLocalSearch && searchQuery.length >= 2 && (
        <View style={{
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          marginTop: 5,
          borderRadius: 10,
          padding: 6,
          borderWidth: 1,
          borderColor: 'rgba(0, 212, 170, 0.3)',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#00D4AA', fontSize: 11, textAlign: 'center' }}>
            🌐 Searching globally with 2-second delay...
          </Text>
        </View>
      )}
    </View>
  );
};

export default CompactSearchBar;