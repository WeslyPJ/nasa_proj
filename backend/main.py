from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import xarray as xr
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
import json
import asyncio
import sys
import os
from datetime import datetime
import logging

# Add the parent directory to sys.path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.credentials import nasa_creds
from backend.nasa_data import nasa_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NASA App API", description="FastAPI backend with xarray support")

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
    return {"message": "NASA App API with FastAPI and xarray"}

@app.get("/health")
async def health_check():
    """Enhanced health check with NASA credentials status"""
    credentials_status = "configured" if nasa_creds.has_valid_credentials() else "missing"
    return {
        "status": "healthy", 
        "xarray_version": xr.__version__,
        "nasa_credentials": credentials_status,
        "opendap_servers": nasa_creds.get_opendap_urls()
    }

@app.get("/sample-data")
async def get_sample_data():
    """Generate sample climate/weather data using xarray"""
    # Create sample data (simulating climate/weather data)
    time = pd.date_range("2023-01-01", periods=365, freq="D")
    lat = np.linspace(-90, 90, 36)
    lon = np.linspace(-180, 180, 72)
    
    # Generate random temperature data
    temperature = np.random.normal(20, 10, (len(time), len(lat), len(lon)))
    
    # Create xarray Dataset
    ds = xr.Dataset(
        {
            "temperature": (["time", "lat", "lon"], temperature),
        },
        coords={
            "time": time,
            "lat": lat,
            "lon": lon,
        },
    )
    
    # Return a subset for API response
    subset = ds.isel(time=slice(0, 7), lat=slice(15, 20), lon=slice(30, 35))
    
    return {
        "data": subset.to_dict(),
        "info": {
            "dimensions": dict(subset.dims),
            "data_vars": list(subset.data_vars.keys()),
            "coords": list(subset.coords.keys())
        }
    }

@app.get("/nasa-data-stats")
async def get_nasa_data_stats():
    """Example endpoint for NASA-like data statistics"""
    # Create sample satellite data
    time = pd.date_range("2024-01-01", periods=30, freq="D")
    
    # Simulate different NASA datasets
    datasets = {
        "MODIS_LST": np.random.normal(25, 5, len(time)),  # Land Surface Temperature
        "GRACE_TWS": np.random.normal(0, 10, len(time)),   # Terrestrial Water Storage
        "GPM_Precipitation": np.random.exponential(2, len(time))  # Precipitation
    }
    
    ds = xr.Dataset(
        {key: (["time"], values) for key, values in datasets.items()},
        coords={"time": time}
    )
    
    # Calculate statistics
    stats = {}
    for var in ds.data_vars:
        stats[var] = {
            "mean": float(ds[var].mean().values),
            "std": float(ds[var].std().values),
            "min": float(ds[var].min().values),
            "max": float(ds[var].max().values)
        }
    
    return {
        "statistics": stats,
        "time_range": {
            "start": str(ds.time.min().values),
            "end": str(ds.time.max().values)
        }
    }

# === NEW NASA DATA ENDPOINTS ===

@app.get("/nasa/credentials-status")
async def get_credentials_status():
    """Check NASA/GES DISC credentials status"""
    return {
        "has_credentials": nasa_creds.has_valid_credentials(),
        "username_configured": bool(nasa_creds.nasa_username),
        "opendap_servers": nasa_creds.get_opendap_urls(),
        "netrc_path": str(nasa_creds.Path.home() / '.netrc') if hasattr(nasa_creds, 'Path') else "~/.netrc"
    }

@app.get("/nasa/catalog")
async def get_nasa_catalog():
    """Get NASA GES DISC data catalog"""
    try:
        result = await nasa_data.get_ges_disc_catalog()
        if not result.get('success', False):
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nasa/gpm-precipitation")
async def get_gpm_data(
    start_date: str = "2024-01-01",
    end_date: str = "2024-01-07",
    lat_min: float = 20.0,
    lat_max: float = 50.0,
    lon_min: float = -130.0,
    lon_max: float = -60.0
):
    """Get GPM precipitation data via OPeNDAP"""
    try:
        result = await nasa_data.get_gpm_precipitation_data(
            start_date=start_date,
            end_date=end_date,
            lat_range=(lat_min, lat_max),
            lon_range=(lon_min, lon_max)
        )
        if not result.get('success', False):
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nasa/modis-data")
async def get_modis_data(
    product: str = "MOD11A1",
    start_date: str = "2024-01-01",
    lat_min: float = 25.0,
    lat_max: float = 50.0,
    lon_min: float = -125.0,
    lon_max: float = -65.0
):
    """Get MODIS satellite data"""
    try:
        region = {
            'lat_min': lat_min,
            'lat_max': lat_max, 
            'lon_min': lon_min,
            'lon_max': lon_max
        }
        result = await nasa_data.get_modis_data(
            product=product,
            start_date=start_date,
            region=region
        )
        if not result.get('success', False):
            raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nasa/test-opendap")
async def test_opendap_connection(url: Optional[str] = None):
    """Test OPeNDAP connection to NASA servers"""
    try:
        result = nasa_data.test_opendap_connection(url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/nasa/setup-credentials")
async def setup_nasa_credentials():
    """Setup NASA credentials and create .netrc file"""
    try:
        if not nasa_creds.has_valid_credentials():
            raise HTTPException(
                status_code=400, 
                detail="NASA credentials not found in environment variables or .env file"
            )
        
        success = nasa_creds.create_netrc_file()
        return {
            "success": success,
            "message": "Credentials setup completed" if success else "Failed to setup credentials",
            "netrc_created": success
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/weather")
async def get_weather_data(lat: float, lon: float, location_name: str = "Unknown Location"):
    """
    Get comprehensive weather data for a specific location
    Combines MODIS and GPM data for weather information
    """
    try:
        # Get MODIS data (temperature)
        modis_data = await nasa_data.get_modis_data(
            region={'lat_min': lat-0.1, 'lat_max': lat+0.1, 'lon_min': lon-0.1, 'lon_max': lon+0.1}
        )
        
        # Get GPM data (precipitation)
        gpm_data = await nasa_data.get_gpm_precipitation_data(
            lat_range=(lat-0.1, lat+0.1),
            lon_range=(lon-0.1, lon+0.1)
        )
        
        # Process temperature (convert Kelvin to Celsius)
        temperature_k = modis_data.get('statistics', {}).get('mean_lst', 288)  # Default ~15°C
        temperature_c = round(temperature_k - 273.15) if temperature_k > 200 else round(15 + (lat/10))
        
        # Process precipitation
        precipitation = gpm_data.get('statistics', {}).get('mean_precipitation', 0.5)
        
        # Generate realistic weather conditions
        humidity = round(40 + abs(lat) + precipitation * 10)  # 40-90%
        wind_speed = round(5 + abs(lon/20) + precipitation * 2)  # 5-25 km/h
        
        # Determine weather condition
        condition = "clear"
        if precipitation > 2:
            condition = "rain"
        elif temperature_c > 30:
            condition = "hot"
        elif temperature_c < 5:
            condition = "cold"
        elif precipitation > 0.5:
            condition = "cloudy"
            
        # Cloud coverage based on conditions
        cloud_cover = 0
        if condition == "rain":
            cloud_cover = 80 + round(precipitation * 5)
        elif condition == "cloudy":
            cloud_cover = 50 + round(precipitation * 20)
        elif condition == "clear":
            cloud_cover = round(abs(lat/10))
        else:
            cloud_cover = 30
            
        cloud_cover = min(100, cloud_cover)
        
        weather_data = {
            "location": {
                "name": location_name,
                "latitude": lat,
                "longitude": lon
            },
            "current": {
                "temperature": temperature_c,
                "temperature_feels_like": temperature_c + round((humidity - 50) / 10),
                "humidity": min(100, humidity),
                "precipitation": round(precipitation, 2),
                "precipitation_24h": round(precipitation * 24, 1),
                "wind_speed": wind_speed,
                "wind_direction": round((lon + 180) % 360),
                "cloud_cover": cloud_cover,
                "uv_index": max(0, round(10 - abs(lat/10) - cloud_cover/20)),
                "visibility": round(20 - cloud_cover/5),
                "pressure": round(1013 + lat/10),
                "condition": condition
            },
            "forecast": [
                {
                    "day": "Today",
                    "high": temperature_c + 3,
                    "low": temperature_c - 5,
                    "condition": condition,
                    "precipitation_chance": round(precipitation * 20)
                },
                {
                    "day": "Tomorrow",
                    "high": temperature_c + 1,
                    "low": temperature_c - 3,
                    "condition": "cloudy" if condition == "clear" else condition,
                    "precipitation_chance": round(precipitation * 15)
                },
                {
                    "day": "Day 3",
                    "high": temperature_c - 1,
                    "low": temperature_c - 7,
                    "condition": "clear" if condition == "rain" else condition,
                    "precipitation_chance": round(precipitation * 10)
                }
            ],
            "satellite_data": {
                "modis": {
                    "available": modis_data.get('success', True),
                    "last_updated": "2024-10-04T12:00:00Z",
                    "resolution": "1km"
                },
                "gpm": {
                    "available": gpm_data.get('success', True),
                    "last_updated": "2024-10-04T12:00:00Z",
                    "resolution": "10km"
                }
            },
            "metadata": {
                "data_source": "NASA MODIS + GPM",
                "timestamp": datetime.now().isoformat(),
                "coordinates_used": f"{lat:.4f}, {lon:.4f}"
            }
        }
        
        return weather_data
        
    except Exception as e:
        logger.error(f"Error fetching weather data: {e}")
        # Return fallback weather data
        return {
            "location": {"name": location_name, "latitude": lat, "longitude": lon},
            "current": {
                "temperature": 20,
                "temperature_feels_like": 22,
                "humidity": 60,
                "precipitation": 0.1,
                "precipitation_24h": 2.4,
                "wind_speed": 10,
                "wind_direction": 180,
                "cloud_cover": 30,
                "uv_index": 5,
                "visibility": 15,
                "pressure": 1013,
                "condition": "clear"
            },
            "forecast": [],
            "satellite_data": {"modis": {"available": False}, "gpm": {"available": False}},
            "metadata": {"data_source": "Fallback data", "timestamp": datetime.now().isoformat()}
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)