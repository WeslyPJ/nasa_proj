import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, ActivityIndicator } from 'react-native';
import { searchStyles } from '../styles';

const SearchBar = ({ visible, onLocationSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  if (!visible) return null;

  // Geocoding function using OpenStreetMap Nominatim API (free)
  const searchLocation = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`
      );
      const data = await response.json();
      
      const formattedResults = data.map((item, index) => ({
        id: index,
        name: item.display_name.split(',')[0], // Primary name
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'location',
        icon: getLocationIcon(item.type, item.class),
        address: formatAddress(item.display_name)
      }));

      setSearchResults(formattedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate icon for location type
  const getLocationIcon = (type, locationClass) => {
    if (type === 'city' || locationClass === 'place') return '🏙️';
    if (type === 'country') return '🌍';
    if (type === 'state' || type === 'administrative') return '🗺️';
    if (type === 'mountain' || type === 'peak') return '⛰️';
    if (type === 'lake' || type === 'river') return '🏞️';
    if (type === 'beach' || type === 'coastline') return '🏖️';
    if (type === 'building' || type === 'attraction') return '🏛️';
    if (type === 'airport') return '✈️';
    if (type === 'railway') return '🚂';
    return '📍';
  };

  // Format address for display
  const formatAddress = (fullAddress) => {
    const parts = fullAddress.split(',');
    if (parts.length > 3) {
      return parts.slice(1, 4).join(',').trim();
    }
    return parts.slice(1).join(',').trim();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    // Debounce search
    clearTimeout(searchLocation.timeoutId);
    searchLocation.timeoutId = setTimeout(() => {
      searchLocation(text);
    }, 500);
  };

  const handleSelectLocation = (location) => {
    const selectedLocation = {
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      icon: location.icon,
      address: location.address
    };
    onLocationSelect(selectedLocation);
    setSearchQuery('');
    setShowResults(false);
    onClose();
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={{
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 212, 170, 0.2)',
        backgroundColor: 'rgba(0, 212, 170, 0.05)'
      }}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, marginRight: 10 }}>{item.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
            {item.name}
          </Text>
          <Text style={{ color: '#00D4AA', fontSize: 12, marginTop: 2 }}>
            {item.address}
          </Text>
          <Text style={{ color: '#A0A0A0', fontSize: 11, marginTop: 1 }}>
            📍 {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={searchStyles.searchContainer}>
      <TouchableOpacity style={searchStyles.closeButton} onPress={onClose}>
        <Text style={searchStyles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      <Text style={searchStyles.searchTitle}>🔍 Search Locations</Text>
      
      {/* Search Input */}
      <View style={{
        backgroundColor: 'rgba(0, 212, 170, 0.1)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 170, 0.3)',
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15
      }}>
        <Text style={{ fontSize: 18, color: '#00D4AA', marginRight: 10 }}>🔍</Text>
        <TextInput
          style={{
            flex: 1,
            color: '#ffffff',
            fontSize: 16,
            paddingVertical: 12,
            fontWeight: '500'
          }}
          placeholder="Search cities, landmarks, addresses..."
          placeholderTextColor="#A0A0A0"
          value={searchQuery}
          onChangeText={handleSearch}
          autoFocus={true}
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator size="small" color="#00D4AA" style={{ marginLeft: 10 }} />
        )}
      </View>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <View style={{
          backgroundColor: 'rgba(15, 25, 45, 0.95)',
          borderRadius: 15,
          maxHeight: 300,
          borderWidth: 1,
          borderColor: 'rgba(0, 212, 170, 0.3)'
        }}>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* No Results */}
      {showResults && searchResults.length === 0 && !loading && searchQuery.length > 2 && (
        <View style={{
          padding: 20,
          alignItems: 'center',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderRadius: 15,
          borderWidth: 1,
          borderColor: 'rgba(255, 107, 107, 0.3)'
        }}>
          <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '600' }}>
            🚫 No locations found
          </Text>
          <Text style={{ color: '#A0A0A0', fontSize: 14, marginTop: 5, textAlign: 'center' }}>
            Try searching for cities, landmarks, or addresses
          </Text>
        </View>
      )}

      {/* Search Tips */}
      {!showResults && searchQuery.length === 0 && (
        <View style={{
          padding: 15,
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          borderRadius: 15,
          borderWidth: 1,
          borderColor: 'rgba(0, 212, 170, 0.2)'
        }}>
          <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            💡 Search Tips:
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 12, lineHeight: 18 }}>
            • Type city names: "New York", "London", "Tokyo"{'\n'}
            • Search landmarks: "Eiffel Tower", "Golden Gate Bridge"{'\n'}
            • Find addresses: "Times Square", "Central Park"{'\n'}
            • Explore places: "Mount Everest", "Grand Canyon"
          </Text>
        </View>
      )}
    </View>
  );
};

export default SearchBar;