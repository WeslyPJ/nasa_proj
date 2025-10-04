import { PermissionsAndroid, Platform, Alert } from 'react-native';

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

export const locationPermissionConfig = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  forceRequestLocation: true,
  forceLocationManager: false,
  showLocationDialog: true,
  useSignificantChanges: false,
};