import { PermissionsAndroid, Platform, Alert } from 'react-native';

/**
 * Request location permission from the user
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Weather App Location Permission',
          message: 'Weather App needs access to your location to provide accurate weather data.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted');
        return true;
      } else {
        console.log('Location permission denied');
        Alert.alert(
          'Permission Required',
          'Location permission is required to show weather for your current location. You can still search for other locations.'
        );
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    // iOS permissions are handled automatically by react-native-geolocation-service
    return true;
  }
};

/**
 * Configuration for location services
 */
export const locationPermissionConfig = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  forceRequestLocation: true,
  forceLocationManager: false,
  showLocationDialog: true,
  useSignificantChanges: false,
};

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