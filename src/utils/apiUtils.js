import { API_BASE_URL } from '../constants';

/**
 * Fetch weather data for a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude  
 * @param {string} locationName - Name of the location
 * @returns {Promise<Object>} Weather data
 */
export const fetchWeatherData = async (lat, lon, locationName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(locationName)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const weatherData = await response.json();

    // Process the comprehensive weather data
    return {
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
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw error;
  }
};

/**
 * Check API health status
 * @returns {Promise<Object>} API health data
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};