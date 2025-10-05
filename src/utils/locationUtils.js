import { Alert } from 'react-native';

/**
 * Determine weather condition based on temperature and precipitation
 * @param {number} temperature - Temperature in Kelvin
 * @param {number} precipitation - Precipitation in mm
 * @returns {string} Weather condition
 */
export const getWeatherCondition = (temperature, precipitation) => {
  if (precipitation > 2) return 'rain';
  if (temperature > 303) return 'hot'; // > 30°C
  if (temperature < 283) return 'cold'; // < 10°C
  if (Math.random() > 0.5) return 'cloudy';
  return 'clear';
};