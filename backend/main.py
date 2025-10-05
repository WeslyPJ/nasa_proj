from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import os
import logging
from datetime import datetime, timedelta
import aiohttp
import asyncio
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ForeTrip API", description="Clean weather API backend for ForeTrip")

# Enable CORS for Expo app
# Get allowed origins from environment variable, default to allow all for development
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*')
if ALLOWED_ORIGINS == '*':
    allow_origins = ["*"]
else:
    allow_origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "ForeTrip API - Clean Weather Service"}

@app.get("/health")
async def health_check():
    """Simple health check"""
    return {
        "status": "healthy", 
        "service": "ForeTrip Weather API",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/geocode")
async def geocode_location(q: str):
    """
    Convert place name to coordinates using Visual Crossing Geocoding API
    """
    try:
        API_KEY = os.getenv('VISUAL_CROSSING_API_KEY', 'YOUR_API_KEY_HERE')
        
        if API_KEY == 'YOUR_API_KEY_HERE':
            logger.warning("API key not configured, returning mock geocoding data")
            return generate_mock_geocoding_data(q)
        
        # Visual Crossing geocoding endpoint
        url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{q}"
        
        params = {
            'key': API_KEY,
            'unitGroup': 'metric',
            'include': 'current',
            'elements': 'latitude,longitude,address,resolvedAddress'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        # Format response to match expected frontend format
                        results = [{
                            "lat": data.get("latitude"),
                            "lon": data.get("longitude"),
                            "display_name": data.get("resolvedAddress", q),
                            "name": q,
                            "country": "Unknown"
                        }]
                        return {"results": results}
                    else:
                        logger.error(f"Geocoding API error: {response.status}")
                        return generate_mock_geocoding_data(q)
        except Exception as e:
            logger.error(f"Geocoding request error: {e}")
            return generate_mock_geocoding_data(q)
            
    except Exception as e:
        logger.error(f"Error in geocoding: {e}")
        return generate_mock_geocoding_data(q)

@app.get("/weather")
async def get_weather_data(
    lat: float, 
    lon: float, 
    location_name: str = "Unknown Location",
    date: str = None
):
    """
    Get comprehensive weather data for a specific location using Visual Crossing Weather API format
    Supports both current weather and historical/forecast data with date parameter
    """
    try:
        # Visual Crossing API key
        API_KEY = os.getenv('VISUAL_CROSSING_API_KEY', 'YOUR_API_KEY_HERE')
        
        # Build Visual Crossing Weather API endpoint with optional date
        if date:
            # Format: YYYY-MM-DD for specific date, or date range YYYY-MM-DD/YYYY-MM-DD
            url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{lat},{lon}/{date}"
        else:
            # Current weather and 7-day forecast
            url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{lat},{lon}"
        
        params = {
            'key': API_KEY,
            'unitGroup': 'metric',  # Use metric units
            'include': 'current,days,hours',
            'elements': 'datetime,temp,feelslike,humidity,precip,windspeed,winddir,cloudcover,uvindex,visibility,pressure,conditions,description,tempmax,tempmin'
        }
        
        # If API key is not configured, return mock data in Visual Crossing format
        if API_KEY == 'YOUR_API_KEY_HERE':
            logger.warning("Visual Crossing API key not configured, returning mock data")
            return generate_mock_visual_crossing_data(lat, lon, location_name, date)
        
        # Make request to Visual Crossing API
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        return format_visual_crossing_response(data, location_name, lat, lon)
                    else:
                        logger.error(f"Visual Crossing API error: {response.status}")
                        return generate_mock_visual_crossing_data(lat, lon, location_name)
        except asyncio.TimeoutError:
            logger.error("Visual Crossing API timeout")
            return generate_mock_visual_crossing_data(lat, lon, location_name)
        except Exception as e:
            logger.error(f"Visual Crossing API request error: {e}")
            return generate_mock_visual_crossing_data(lat, lon, location_name)
                    
    except Exception as e:
        logger.error(f"Error fetching weather data: {e}")
        return generate_mock_visual_crossing_data(lat, lon, location_name, date)

def generate_mock_geocoding_data(place_name: str):
    """Generate mock geocoding data for testing"""
    # Simple mock data based on common place names
    mock_locations = {
        "new york": {"lat": 40.7128, "lon": -74.0060, "address": "New York, NY, USA", "country": "United States"},
        "london": {"lat": 51.5074, "lon": -0.1278, "address": "London, England, UK", "country": "United Kingdom"},
        "paris": {"lat": 48.8566, "lon": 2.3522, "address": "Paris, France", "country": "France"},
        "tokyo": {"lat": 35.6762, "lon": 139.6503, "address": "Tokyo, Japan", "country": "Japan"},
        "sydney": {"lat": -33.8688, "lon": 151.2093, "address": "Sydney, NSW, Australia", "country": "Australia"},
        "dubai": {"lat": 25.2048, "lon": 55.2708, "address": "Dubai, UAE", "country": "UAE"},
        "mumbai": {"lat": 19.0760, "lon": 72.8777, "address": "Mumbai, Maharashtra, India", "country": "India"},
        "los angeles": {"lat": 34.0522, "lon": -118.2437, "address": "Los Angeles, CA, USA", "country": "United States"},
        "chicago": {"lat": 41.8781, "lon": -87.6298, "address": "Chicago, IL, USA", "country": "United States"},
        "madrid": {"lat": 40.4168, "lon": -3.7038, "address": "Madrid, Spain", "country": "Spain"}
    }
    
    place_lower = place_name.lower().strip()
    results = []
    
    # Check for exact or partial matches
    for key, data in mock_locations.items():
        if key in place_lower or place_lower in key:
            results.append({
                "lat": data["lat"],
                "lon": data["lon"], 
                "display_name": data["address"],
                "name": key.title(),
                "country": data["country"]
            })
    
    # If no matches found, return a default result
    if not results:
        results.append({
            "lat": 40.7128,
            "lon": -74.0060,
            "display_name": f"Mock location for '{place_name}'",
            "name": place_name,
            "country": "Unknown"
        })
    
    return {"results": results}

def generate_mock_visual_crossing_data(lat: float, lon: float, location_name: str, date: str = None):
    """Generate realistic mock weather data in Visual Crossing format"""
    
    # Generate realistic temperature based on latitude and season
    base_temp = 20 - (abs(lat) / 3)  # Cooler at higher latitudes
    temp_variation = random.uniform(-5, 5)
    temperature = round(base_temp + temp_variation, 1)
    
    # Generate other realistic values
    humidity = random.randint(30, 90)
    precip = round(random.uniform(0, 5), 1)
    wind_speed = round(random.uniform(5, 25), 1)
    wind_dir = random.randint(0, 359)
    cloud_cover = random.randint(0, 100)
    uv_index = max(0, random.randint(1, 11) - abs(lat) // 10)
    visibility = round(random.uniform(10, 30), 1)
    pressure = round(random.uniform(990, 1030), 1)
    
    # Determine conditions based on weather
    if precip > 2:
        conditions = "Rain"
        description = "Rainy weather with precipitation"
        icon = "rain"
    elif cloud_cover > 80:
        conditions = "Overcast"
        description = "Overcast skies with heavy cloud cover"
        icon = "cloudy"
    elif cloud_cover > 50:
        conditions = "Partly cloudy"
        description = "Partly cloudy with some sun"
        icon = "partly-cloudy"
    else:
        conditions = "Clear"
        description = "Clear skies with plenty of sunshine"
        icon = "clear"
    
    # Generate forecast for next 7 days
    forecast_days = []
    current_date = datetime.now()
    
    for i in range(7):
        forecast_date = current_date + timedelta(days=i)
        day_temp = temperature + random.uniform(-3, 3)
        night_temp = day_temp - random.uniform(5, 10)
        day_precip = round(random.uniform(0, 3), 1)
        
        if day_precip > 1:
            day_conditions = "Rain"
            day_icon = "rain"
        elif random.choice([True, False]):
            day_conditions = "Partly cloudy"
            day_icon = "partly-cloudy"
        else:
            day_conditions = "Clear"
            day_icon = "clear"
        
        forecast_days.append({
            "datetime": forecast_date.strftime("%Y-%m-%d"),
            "tempmax": round(day_temp, 1),
            "tempmin": round(night_temp, 1),
            "temp": round((day_temp + night_temp) / 2, 1),
            "feelslike": round((day_temp + night_temp) / 2 + random.uniform(-2, 2), 1),
            "humidity": random.randint(30, 90),
            "precip": day_precip,
            "windspeed": round(random.uniform(5, 20), 1),
            "winddir": random.randint(0, 359),
            "cloudcover": random.randint(0, 100),
            "uvindex": max(0, random.randint(1, 10)),
            "visibility": round(random.uniform(15, 30), 1),
            "pressure": round(random.uniform(995, 1025), 1),
            "conditions": day_conditions,
            "description": f"{day_conditions} weather expected",
            "icon": day_icon
        })
    
    return {
        "queryCost": 1,
        "latitude": lat,
        "longitude": lon,
        "resolvedAddress": location_name,
        "address": f"{lat},{lon}",
        "timezone": "UTC",
        "tzoffset": 0.0,
        "currentConditions": {
            "datetime": datetime.now().strftime("%H:%M:%S"),
            "datetimeEpoch": int(datetime.now().timestamp()),
            "temp": temperature,
            "feelslike": round(temperature + random.uniform(-2, 2), 1),
            "humidity": humidity,
            "precip": precip,
            "windspeed": wind_speed,
            "winddir": wind_dir,
            "cloudcover": cloud_cover,
            "uvindex": uv_index,
            "visibility": visibility,
            "pressure": pressure,
            "conditions": conditions,
            "description": description,
            "icon": icon
        },
        "days": forecast_days
    }

def format_visual_crossing_response(data: dict, location_name: str, lat: float, lon: float):
    """Format Visual Crossing API response to match our expected format"""
    current = data.get('currentConditions', {})
    days = data.get('days', [])
    
    return {
        "queryCost": data.get('queryCost', 1),
        "latitude": lat,
        "longitude": lon,
        "resolvedAddress": location_name,
        "address": data.get('address', f"{lat},{lon}"),
        "timezone": data.get('timezone', 'UTC'),
        "tzoffset": data.get('tzoffset', 0.0),
        "currentConditions": {
            "datetime": current.get('datetime', datetime.now().strftime("%H:%M:%S")),
            "datetimeEpoch": current.get('datetimeEpoch', int(datetime.now().timestamp())),
            "temp": current.get('temp', 20),
            "feelslike": current.get('feelslike', 20),
            "humidity": current.get('humidity', 50),
            "precip": current.get('precip', 0),
            "windspeed": current.get('windspeed', 10),
            "winddir": current.get('winddir', 180),
            "cloudcover": current.get('cloudcover', 30),
            "uvindex": current.get('uvindex', 5),
            "visibility": current.get('visibility', 20),
            "pressure": current.get('pressure', 1013),
            "conditions": current.get('conditions', 'Clear'),
            "description": current.get('description', 'Clear weather'),
            "icon": get_weather_icon(current.get('conditions', 'Clear'))
        },
        "days": days[:7]  # Return next 7 days
    }

def get_weather_icon(conditions: str) -> str:
    """Get weather icon based on conditions"""
    if not conditions:
        return 'clear'
        
    condition_lower = conditions.lower()
    
    if 'rain' in condition_lower or 'shower' in condition_lower:
        return 'rain'
    elif 'snow' in condition_lower:
        return 'snow'
    elif 'cloud' in condition_lower or 'overcast' in condition_lower:
        return 'cloudy'
    elif 'partly' in condition_lower:
        return 'partly-cloudy'
    elif 'clear' in condition_lower or 'sunny' in condition_lower:
        return 'clear'
    elif 'fog' in condition_lower or 'mist' in condition_lower:
        return 'fog'
    elif 'thunder' in condition_lower or 'storm' in condition_lower:
        return 'thunderstorm'
    else:
        return 'clear'

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment variables
    HOST = os.getenv('API_HOST', '0.0.0.0')
    PORT = int(os.getenv('API_PORT', '8001'))
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'info')
    
    print("🚀 Starting ForeTrip Weather API...")
    print(f"📍 Server will be available at: http://{HOST}:{PORT}")
    print(f"📚 API Documentation: http://{HOST}:{PORT}/docs")
    print(f"🔧 Host: {HOST}, Port: {PORT}, Log Level: {LOG_LEVEL}")
    
    try:
        uvicorn.run(app, host=HOST, port=PORT, log_level=LOG_LEVEL)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()