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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
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

@app.get("/weather")
async def get_weather_data(lat: float, lon: float, location_name: str = "Unknown Location"):
    """
    Get comprehensive weather data for a specific location using Visual Crossing Weather API format
    """
    try:
        # Visual Crossing API key
        API_KEY = os.getenv('VISUAL_CROSSING_API_KEY', 'YOUR_API_KEY_HERE')
        
        # Visual Crossing Weather API endpoint
        url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{lat},{lon}"
        
        params = {
            'key': API_KEY,
            'unitGroup': 'metric',  # Use metric units
            'include': 'current,days,hours',
            'elements': 'datetime,temp,feelslike,humidity,precip,windspeed,winddir,cloudcover,uvindex,visibility,pressure,conditions,description'
        }
        
        # If API key is not configured, return mock data in Visual Crossing format
        if API_KEY == 'YOUR_API_KEY_HERE':
            logger.warning("Visual Crossing API key not configured, returning mock data")
            return generate_mock_visual_crossing_data(lat, lon, location_name)
        
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
        return generate_mock_visual_crossing_data(lat, lon, location_name)

def generate_mock_visual_crossing_data(lat: float, lon: float, location_name: str):
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
    print("🚀 Starting ForeTrip Weather API...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📚 API Documentation: http://localhost:8001/docs")
    try:
        uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()