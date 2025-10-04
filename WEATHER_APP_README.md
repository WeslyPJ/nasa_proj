# 🌦️ NASA Weather App

A beautiful, interactive weather application with Google Maps-style UI that utilizes real NASA satellite data (MODIS and GPM) to provide accurate weather information for any location worldwide.

## ✨ Features

### 🗺️ **Interactive Map Interface**
- **Google Maps-style** navigation and UI
- **Live location tracking** with GPS integration
- **Popular tourist destinations** pre-loaded
- **Tap-to-get-weather** functionality anywhere on the map
- **Custom markers** for different location types

### 🛰️ **NASA Satellite Data Integration**
- **MODIS satellite data** for land surface temperature
- **GPM (Global Precipitation Measurement)** for rainfall data
- **Real-time satellite status** indicators
- **Comprehensive weather metrics** from space-based observations

### 🎨 **Beautiful UI/UX**
- **Animated weather cards** with condition-based colors
- **Gradient backgrounds** that change with weather conditions
- **Smooth animations** and transitions
- **Mobile-optimized** touch interactions
- **Glassmorphism effects** and modern design

### 📍 **Location Features**
- **Smart location search** with autocomplete
- **Popular tourist spots** quick access
- **Current location detection** with permissions
- **Coordinate-based** weather lookup
- **Location history** and favorites

### 🌡️ **Comprehensive Weather Data**
- **Temperature** (current and feels-like)
- **Precipitation** (current and 24-hour forecast)
- **Humidity, Wind Speed & Direction**
- **Cloud Cover, UV Index, Visibility**
- **Atmospheric Pressure**
- **3-day weather forecast**

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+ with virtual environment
- **NASA Earthdata account** (free): https://urs.earthdata.nasa.gov/users/new
- Expo CLI or Expo Go app on your mobile device

### 1. **Setup NASA Credentials**
```bash
# Interactive setup (recommended)
python setup_nasa_credentials.py

# Or manually create .env file:
# NASA_USERNAME=your_username
# NASA_PASSWORD=your_password
```

### 2. **Start the Backend API**
```bash
# Start NASA data API server
python backend/main.py

# Server runs on http://localhost:8001
# API docs: http://localhost:8001/docs
```

### 3. **Start the Mobile App**
```bash
# Install dependencies (if not done)
npm install

# Start Expo development server
npm start

# Scan QR code with Expo Go app
# Or press 'w' for web version
```

## 📱 **App Interface Guide**

### **Main Screen Components**

1. **🔍 Search Bar**
   - Type city names or tourist destinations
   - Autocomplete suggestions appear
   - Tap location to get weather data

2. **📍 Location Button**
   - Blue circular button next to search
   - Gets your current GPS location
   - Automatically fetches local weather

3. **🗺️ Interactive Map**
   - **Red markers**: Popular tourist destinations
   - **Blue marker**: Your selected location
   - **Tap anywhere**: Get weather for that coordinate
   - **Pinch/zoom**: Navigate the map

4. **🌦️ Weather Card**
   - **Animated gradient**: Changes with conditions
   - **Temperature display**: Large, easy-to-read
   - **Weather details**: Comprehensive metrics
   - **Satellite status**: NASA data availability

5. **🏖️ Popular Destinations**
   - **Bottom carousel**: Quick access to tourist spots
   - **Gradient cards**: Beautiful location previews
   - **One-tap access**: Instant weather data

### **Weather Conditions & Animations**

- **☀️ Clear**: Blue gradient with pulse animation
- **🌧️ Rain**: Dark blue with bounce animation  
- **☁️ Cloudy**: Gray gradient with fade animation
- **🔥 Hot**: Red/orange with flash animation
- **❄️ Cold**: Blue gradient with pulse animation

## 🛰️ **NASA Data Sources**

### **MODIS (Moderate Resolution Imaging Spectroradiometer)**
- **Land Surface Temperature**: Thermal infrared measurements
- **Resolution**: 1km spatial resolution
- **Update**: Daily satellite passes
- **Coverage**: Global land surface monitoring

### **GPM (Global Precipitation Measurement)**
- **Precipitation**: Rain, snow, and mixed precipitation
- **Resolution**: 10km spatial resolution  
- **Update**: 30-minute intervals
- **Coverage**: Global precipitation monitoring

### **Data Processing**
- **Real-time integration** with xarray
- **Quality control** and validation
- **Coordinate-based** data extraction
- **Statistical analysis** and forecasting

## 🎯 **Popular Destinations Included**

### **🌎 Americas**
- New York City, USA
- Los Angeles, USA  
- Miami, USA

### **🌍 Europe**
- London, United Kingdom
- Paris, France
- Rome, Italy
- Barcelona, Spain

### **🌏 Asia-Pacific**
- Tokyo, Japan
- Bangkok, Thailand
- Singapore
- Sydney, Australia

### **🌐 Middle East**
- Dubai, UAE

## 🔧 **Technical Architecture**

### **Frontend (React Native + Expo)**
```
WeatherApp.js          # Main weather interface
locationUtils.js       # GPS and permissions
mapStyles.js          # Custom map styling
App.js                # App entry point
```

### **Backend (FastAPI + NASA APIs)**
```
backend/main.py        # FastAPI server & weather endpoint
backend/nasa_data.py   # NASA satellite data processing
backend/credentials.py # Secure credential management
```

### **API Endpoints**
- `GET /weather?lat={lat}&lon={lon}&location_name={name}`
- `GET /health` - Server health check
- `GET /nasa/modis-data` - MODIS satellite data
- `GET /nasa/gpm-precipitation` - GPM rainfall data

## 📊 **Weather Data Structure**

```json
{
  "location": {
    "name": "New York City",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "current": {
    "temperature": 22,
    "temperature_feels_like": 24,
    "humidity": 65,
    "precipitation": 0.2,
    "wind_speed": 15,
    "cloud_cover": 30,
    "uv_index": 6,
    "condition": "clear"
  },
  "forecast": [...],
  "satellite_data": {
    "modis": {"available": true},
    "gpm": {"available": true}
  }
}
```

## 🔐 **Security & Privacy**

### **Credential Security**
- **.env file** for sensitive data (gitignored)
- **.netrc support** for automatic authentication
- **Environment variables** for production
- **No hardcoded credentials** in source code

### **Location Privacy**
- **Permission-based** location access
- **No location data storage** on servers
- **User control** over location sharing
- **Fallback options** without GPS

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"API connection failed"**
   - Ensure backend server is running on port 8001
   - Check NASA credentials in .env file
   - Verify internet connection

2. **"Location permission denied"**
   - Enable location services in device settings
   - Grant app permission when prompted
   - Use search functionality as alternative

3. **"No weather data available"**
   - Check if NASA satellites are active (status indicators)
   - Try different location coordinates
   - Verify backend API is responding

4. **Map not loading**
   - Check internet connection
   - Ensure react-native-maps is properly installed
   - Try restarting the Expo development server

### **Debug Commands**
```bash
# Test backend API
curl http://localhost:8001/health

# Test weather endpoint  
curl "http://localhost:8001/weather?lat=40.7&lon=-74.0&location_name=NYC"

# Check NASA credentials
python -c "from backend.credentials import nasa_creds; print(nasa_creds.has_valid_credentials())"
```

## 🌟 **Advanced Features**

### **Planned Enhancements**
- **Weather alerts** and notifications
- **Radar overlays** on the map
- **Historical weather** data analysis
- **Weather comparison** between locations
- **Offline mode** with cached data
- **Social sharing** of weather reports

### **Customization Options**
- **Map themes** (satellite, hybrid, terrain)
- **Temperature units** (Celsius/Fahrenheit)
- **Language support** for international users
- **Dark/light mode** themes
- **Custom location** bookmarks

## 📞 **Support & Contributing**

### **Support**
- Check the troubleshooting section above
- Review API documentation at `/docs`
- Ensure all dependencies are properly installed

### **Contributing**
- Fork the repository
- Create feature branches
- Follow React Native and Python best practices
- Test thoroughly before submitting PRs

---

## 🎉 **Enjoy Your NASA-Powered Weather App!**

Experience accurate, satellite-based weather data with a beautiful, intuitive interface. Whether you're planning travels to tourist destinations or checking local conditions, this app provides professional-grade weather information powered by NASA's cutting-edge satellite technology! 🛰️🌍