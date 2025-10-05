import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { weatherStyles } from '../styles';

const WeatherCard = ({ weatherData, loading, error }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Get current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const time = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return { date, time };
  };

  // Get local time for the selected location (approximate)
  const getLocalTime = (lat, lon) => {
    const timezoneOffset = Math.round(lon / 15); // Rough timezone calculation
    const localTime = new Date();
    localTime.setHours(localTime.getHours() + timezoneOffset);
    return localTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };
  // Get dynamic color based on weather condition
  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'rain': return '#4FC3F7';
      case 'hot': return '#FF8A65';
      case 'cold': return '#81C784';
      case 'cloudy': return '#A1A1A1';
      case 'clear': return '#FFD54F';
      default: return '#00F5FF';
    }
  };

  // Get temperature color based on value
  const getTemperatureColor = (temp) => {
    if (temp > 30) return '#FF6B6B';
    if (temp > 20) return '#FFE66D';
    if (temp > 10) return '#4ECDC4';
    return '#81C784';
  };

  if (loading) {
    return (
      <View style={[weatherStyles.floatingCard, { height: 100, alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
          <ActivityIndicator size="small" color="#00D4AA" style={{ marginRight: 8 }} />
          <Text style={[weatherStyles.loadingText, { fontSize: 12, color: '#00D4AA', fontWeight: '600' }]}>
            ⚡ Updating Weather...
          </Text>
        </View>
        <Text style={[weatherStyles.loadingText, { fontSize: 10, color: '#A0A0A0', textAlign: 'center' }]}>
          Fetching NASA satellite data
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[weatherStyles.floatingCard, { height: 80 }]}>
        <Text style={[weatherStyles.weatherTitle, { fontSize: 16 }]}>⚠️ Error</Text>
        <Text style={[weatherStyles.errorText, { fontSize: 11 }]}>{error}</Text>
      </View>
    );
  }

  if (!weatherData) {
    const { date, time } = getCurrentDateTime();
    return (
      <TouchableOpacity 
        style={[weatherStyles.floatingCard, { height: isExpanded ? 120 : 80 }]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={[weatherStyles.weatherTitle, { fontSize: 16 }]}>🌍 ForeTrip</Text>
        {isExpanded && (
          <>
            <Text style={[weatherStyles.coordinates, { fontSize: 10 }]}>📅 {date}</Text>
            <Text style={[weatherStyles.coordinates, { fontSize: 10 }]}>🕐 {time}</Text>
          </>
        )}
        <Text style={[weatherStyles.loadingText, { fontSize: 11, marginTop: 5 }]}>
          {isExpanded ? 'Tap a location to get weather data' : 'Tap to expand • Select location for weather'}
        </Text>
      </TouchableOpacity>
    );
  }

  const tempColor = getTemperatureColor(weatherData.temperature);
  const conditionColor = getConditionColor(weatherData.condition);
  const { date, time } = getCurrentDateTime();
  const localTime = weatherData.coordinates ? 
    getLocalTime(weatherData.coordinates.lat, weatherData.coordinates.lon) : time;

  return (
    <TouchableOpacity 
      style={[weatherStyles.floatingCard, { height: isExpanded ? undefined : 100 }]}
      onPress={() => setIsExpanded(!isExpanded)}
    >
      {/* Compact Header - Always Visible */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={[weatherStyles.weatherTitle, { fontSize: 16, textAlign: 'left', marginBottom: 2 }]}>
            {weatherData.location}
          </Text>
          <Text style={[weatherStyles.coordinates, { fontSize: 9, textAlign: 'left' }]}>
            � {weatherData.coordinates?.lat?.toFixed(2)}°, {weatherData.coordinates?.lon?.toFixed(2)}°
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[weatherStyles.temperature, { fontSize: 28, marginBottom: 0 }]}>
            {weatherData.temperature !== null ? `${Math.round(weatherData.temperature)}°C` : 'N/A'}
          </Text>
          <Text style={[weatherStyles.condition, { fontSize: 11, marginBottom: 0 }]}>
            {weatherData.condition === 'clear' ? '☀️' :
             weatherData.condition === 'rain' ? '🌧️' :
             weatherData.condition === 'cloudy' ? '☁️' :
             weatherData.condition === 'hot' ? '🔥' :
             weatherData.condition === 'cold' ? '❄️' : '🌤️'}
          </Text>
        </View>
        <Text style={{ color: '#00D4AA', fontSize: 18 }}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </View>

      {/* Expanded Details */}
      {isExpanded && (
        <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
          <Text style={[weatherStyles.coordinates, { fontSize: 10, marginBottom: 8 }]}>
            📅 {date} | 🕐 Local: {localTime}
          </Text>

          <View style={weatherStyles.weatherDetails}>
            <View style={weatherStyles.detailItem}>
              <Text style={weatherStyles.detailLabel}>🌡️ Feels Like</Text>
              <Text style={weatherStyles.detailValue}>
                {weatherData.feelsLike !== null ? `${Math.round(weatherData.feelsLike)}°C` : 'N/A'}
              </Text>
            </View>

            <View style={weatherStyles.detailItem}>
              <Text style={weatherStyles.detailLabel}>🌧️ Precipitation</Text>
              <Text style={weatherStyles.detailValue}>
                {weatherData.precipitation !== null ? `${weatherData.precipitation.toFixed(1)} mm` : 'N/A'}
              </Text>
            </View>

            <View style={weatherStyles.detailItem}>
              <Text style={weatherStyles.detailLabel}>💧 Humidity</Text>
              <Text style={weatherStyles.detailValue}>
                {weatherData.humidity !== null ? `${Math.round(weatherData.humidity)}%` : 'N/A'}
              </Text>
            </View>

            <View style={weatherStyles.detailItem}>
              <Text style={weatherStyles.detailLabel}>💨 Wind</Text>
              <Text style={weatherStyles.detailValue}>
                {weatherData.windSpeed !== null ? `${weatherData.windSpeed.toFixed(1)} m/s` : 'N/A'}
              </Text>
            </View>

            <View style={weatherStyles.detailItem}>
              <Text style={weatherStyles.detailLabel}>📊 Pressure</Text>
              <Text style={weatherStyles.detailValue}>
                {weatherData.pressure !== null ? `${Math.round(weatherData.pressure)} hPa` : 'N/A'}
              </Text>
            </View>

            <View style={weatherStyles.detailItem}>
              <Text style={weatherStyles.detailLabel}>☀️ UV Index</Text>
              <Text style={weatherStyles.detailValue}>
                {weatherData.uvIndex !== null ? Math.round(weatherData.uvIndex) : 'N/A'}
              </Text>
            </View>
          </View>

          {weatherData.satellite && (
            <View style={[weatherStyles.satelliteInfo, { marginTop: 8 }]}>
              {weatherData.satellite.modis && (
                <View style={weatherStyles.satelliteTag}>
                  <Text style={weatherStyles.satelliteText}>🛰️ MODIS</Text>
                </View>
              )}
              {weatherData.satellite.gpm && (
                <View style={weatherStyles.satelliteTag}>
                  <Text style={weatherStyles.satelliteText}>🌧️ GPM</Text>
                </View>
              )}
            </View>
          )}

          <Text style={[weatherStyles.lastUpdated, { fontSize: 10, marginTop: 8 }]}>
            ⏰ Last updated: {weatherData.lastUpdated}
          </Text>
        </ScrollView>
      )}
    </TouchableOpacity>
  );
};

export default WeatherCard;