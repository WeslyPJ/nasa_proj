import { API_BASE_URL } from '../constants';

/**
 * Fetch weather data for a specific location using Visual Crossing API format
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude  
 * @param {string} locationName - Name of the location
 * @returns {Promise<Object>} Weather data
 */
export const fetchWeatherData = async (lat, lon, locationName, retryCount = 0) => {
  const maxRetries = 3;
  const timeout = 10000; // 10 seconds
  
  try {
    const url = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(locationName)}`;
    console.log('Fetching weather from:', url);
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    );
    
    // Create fetch promise with enhanced headers
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'ForeTrip/1.0.0',
      },
      // Add timeout for fetch
      signal: AbortSignal.timeout ? AbortSignal.timeout(timeout) : undefined,
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const weatherData = await response.json();
    console.log('Weather data received:', weatherData);

    // Process Visual Crossing format
    const current = weatherData.currentConditions || {};
    const forecast = weatherData.days || [];
    
    return {
      location: locationName,
      coordinates: { lat, lon },
      // Current weather using Visual Crossing format
      temperature: Math.round(current.temp || 20),
      feelsLike: Math.round(current.feelslike || current.temp || 20),
      humidity: Math.round(current.humidity || 50),
      precipitation: current.precip || 0,
      precipitation24h: current.precip ? Math.round(current.precip * 24 * 10) / 10 : 0,
      windSpeed: Math.round(current.windspeed || 10),
      windDirection: current.winddir || 180,
      cloudCover: Math.round(current.cloudcover || 30),
      uvIndex: current.uvindex || 5,
      visibility: current.visibility || 20,
      pressure: Math.round(current.pressure || 1013),
      condition: mapVisualCrossingCondition(current.conditions || 'Clear'),
      conditionsText: current.conditions || 'Clear',
      description: current.description || 'Clear weather',
      icon: current.icon || 'clear',
      lastUpdated: new Date().toLocaleTimeString(),
      
      // Forecast data
      forecast: forecast.slice(0, 7).map((day, index) => ({
        day: index === 0 ? 'Today' : 
             index === 1 ? 'Tomorrow' : 
             new Date(day.datetime).toLocaleDateString('en-US', { weekday: 'short' }),
        date: day.datetime,
        high: Math.round(day.tempmax || day.temp || 20),
        low: Math.round(day.tempmin || day.temp || 15),
        condition: mapVisualCrossingCondition(day.conditions || 'Clear'),
        conditionsText: day.conditions || 'Clear',
        description: day.description || 'Clear weather',
        precipitationChance: Math.round((day.precip || 0) * 20), // Convert to percentage
        precipitation: day.precip || 0,
        humidity: day.humidity || 50,
        windSpeed: Math.round(day.windspeed || 10),
        icon: day.icon || 'clear'
      })),
      
      // Additional Visual Crossing data
      timezone: weatherData.timezone || 'UTC',
      resolvedAddress: weatherData.resolvedAddress || locationName,
      
      // Legacy compatibility
      satellite: {
        source: "Visual Crossing Weather API",
        available: true
      }
    };
  } catch (error) {
    console.error(`Weather fetch error (attempt ${retryCount + 1}):`, error);
    
    // Network error handling
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      if (retryCount < maxRetries) {
        console.log(`Network error, retrying in ${(retryCount + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return fetchWeatherData(lat, lon, locationName, retryCount + 1);
      }
      throw new Error('Network unavailable. Please check your internet connection.');
    }
    
    // Timeout error handling
    if (error.message === 'Request timeout' || error.name === 'AbortError') {
      if (retryCount < maxRetries) {
        console.log(`Request timeout, retrying in ${(retryCount + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return fetchWeatherData(lat, lon, locationName, retryCount + 1);
      }
      throw new Error('Request timeout. Please try again.');
    }
    
    // Server error handling with retry
    if (error.message.includes('HTTP 5') && retryCount < maxRetries) {
      console.log(`Server error, retrying in ${(retryCount + 1) * 2000}ms...`);
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
      return fetchWeatherData(lat, lon, locationName, retryCount + 1);
    }
    
    // Generic error with helpful message
    const errorMessage = error.message.includes('HTTP') 
      ? `Server error: ${error.message}` 
      : `Network error: ${error.message}`;
    
    throw new Error(errorMessage);
  }
};

/**
 * Map Visual Crossing weather conditions to our app's condition system
 * @param {string} vcCondition - Visual Crossing condition
 * @returns {string} Mapped condition
 */
const mapVisualCrossingCondition = (vcCondition) => {
  if (!vcCondition) return 'clear';
  
  const condition = vcCondition.toLowerCase();
  
  if (condition.includes('rain') || condition.includes('shower') || condition.includes('drizzle')) {
    return 'rain';
  } else if (condition.includes('snow') || condition.includes('blizzard') || condition.includes('sleet')) {
    return 'snow';
  } else if (condition.includes('thunder') || condition.includes('storm')) {
    return 'thunderstorm';
  } else if (condition.includes('overcast') || condition.includes('cloudy')) {
    return 'cloudy';
  } else if (condition.includes('partly') || condition.includes('scattered')) {
    return 'partly-cloudy';
  } else if (condition.includes('clear') || condition.includes('sunny')) {
    return 'clear';
  } else if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
    return 'fog';
  } else {
    return 'clear';
  }
};

/**
 * Check API health status
 * @returns {Promise<Object>} API health data
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    throw new Error(`API health check failed: ${error.message}`);
  }
};