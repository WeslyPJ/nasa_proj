# 🗺️ Google Maps Setup Guide

## Quick Setup for Mobile Map Visibility

### 1. **Get Google Maps API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Maps SDK for Android" and "Maps SDK for iOS"
4. Create credentials → API Key
5. Restrict the API key to your app (optional but recommended)

### 2. **Configure API Key**
Replace `YOUR_GOOGLE_MAPS_API_KEY` in `app.json` with your actual API key:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
    }
  }
},
"ios": {
  "config": {
    "googleMapsApiKey": "YOUR_ACTUAL_API_KEY_HERE"
  }
}
```

### 3. **Alternative: Use Default Maps (No API Key Needed)**
If you don't want to set up Google Maps API, you can modify the MapView component to use the default maps by removing the `provider` prop:

In `src/components/MapView.js`, remove this line:
```javascript
provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
```

### 4. **Rebuild the App**
After making changes to `app.json`:
```bash
expo start --clear
```

### 5. **Test Map Functionality**
- The map should now be visible on mobile
- You should see loading states and error handling
- Touch the map to get weather data for that location
- Use the floating search button to select popular locations

## Troubleshooting

### Map Not Loading
1. Check internet connection
2. Verify API key is correct
3. Ensure Maps SDK is enabled in Google Cloud Console
4. Check Expo logs for error messages

### Performance Issues
- The app includes custom dark theme map styling
- Loading indicators for better UX
- Error fallbacks if map fails to load

### Permissions
- Location permissions are already configured
- Maps will work without location access
- Current location feature requires GPS permissions