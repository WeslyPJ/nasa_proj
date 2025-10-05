import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { searchStyles } from '../styles';
import { POPULAR_LOCATIONS } from '../constants';

const LocationSearch = ({ visible, onLocationSelect, onClose, onCurrentLocation }) => {
  if (!visible) return null;

  return (
    <View style={searchStyles.searchContainer}>
      <TouchableOpacity style={searchStyles.closeButton} onPress={onClose}>
        <Text style={searchStyles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      <Text style={searchStyles.searchTitle}>🗺️ Select Location</Text>
      
      <TouchableOpacity
        style={[searchStyles.locationButton, searchStyles.currentLocationButton]}
        onPress={onCurrentLocation}
      >
        <Text style={searchStyles.locationButtonText}>📍 Use Current Location</Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
        <View style={searchStyles.locationGrid}>
          {POPULAR_LOCATIONS.map((location, index) => (
            <TouchableOpacity
              key={index}
              style={searchStyles.locationButton}
              onPress={() => onLocationSelect(location)}
            >
              <Text style={searchStyles.locationButtonText}>
                {location.icon} {location.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default LocationSearch;