"""
NASA Weather App Demo Script
Demonstrates the weather app capabilities with sample API calls
"""

import requests
import json
import time
from datetime import datetime

API_BASE_URL = "http://localhost:8001"

def test_weather_for_location(lat, lon, name):
    """Test weather data for a specific location"""
    print(f"\n🌍 Getting weather for {name} ({lat}, {lon})")
    print("-" * 50)
    
    try:
        response = requests.get(f"{API_BASE_URL}/weather", params={
            "lat": lat,
            "lon": lon,
            "location_name": name
        }, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            current = data['current']
            
            print(f"🌡️  Temperature: {current['temperature']}°C (feels like {current['temperature_feels_like']}°C)")
            print(f"🌧️  Precipitation: {current['precipitation']} mm")
            print(f"💧 Humidity: {current['humidity']}%")
            print(f"💨 Wind: {current['wind_speed']} km/h")
            print(f"☁️  Cloud Cover: {current['cloud_cover']}%")
            print(f"👁️  Visibility: {current['visibility']} km")
            print(f"🔆 UV Index: {current['uv_index']}")
            print(f"📊 Pressure: {current['pressure']} hPa")
            print(f"🎯 Condition: {current['condition'].title()}")
            
            # Satellite status
            satellites = data['satellite_data']
            modis_status = "🟢 Active" if satellites['modis']['available'] else "🔴 Offline"
            gpm_status = "🟢 Active" if satellites['gpm']['available'] else "🔴 Offline"
            print(f"🛰️  MODIS: {modis_status}")
            print(f"🛰️  GPM: {gpm_status}")
            
            return True
        else:
            print(f"❌ Failed to get weather data: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 NASA Weather App Demo")
    print("=" * 60)
    print(f"🕐 Demo started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 API Base URL: {API_BASE_URL}")
    
    # Test API health first
    print("\n🔍 Testing API Health...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ API is healthy!")
            print(f"   xarray version: {health_data['xarray_version']}")
            print(f"   NASA credentials: {health_data['nasa_credentials']}")
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        print("   Make sure the backend server is running on port 8001")
        return
    
    # Test popular tourist destinations
    popular_locations = [
        (40.7128, -74.0060, "New York City 🗽"),
        (51.5074, -0.1278, "London 🏰"),
        (48.8566, 2.3522, "Paris 🗼"),
        (35.6762, 139.6503, "Tokyo 🏯"),
        (25.2048, 55.2708, "Dubai 🕌"),
        (-33.8688, 151.2093, "Sydney 🏖️"),
    ]
    
    print("\n🌍 Testing Weather for Popular Tourist Destinations")
    print("=" * 60)
    
    success_count = 0
    for lat, lon, name in popular_locations:
        if test_weather_for_location(lat, lon, name):
            success_count += 1
        time.sleep(1)  # Small delay between requests
    
    # Summary
    print("\n📊 Demo Summary")
    print("=" * 30)
    print(f"✅ Successful requests: {success_count}/{len(popular_locations)}")
    print(f"📈 Success rate: {(success_count/len(popular_locations))*100:.1f}%")
    
    if success_count == len(popular_locations):
        print("\n🎉 All tests passed! The weather app is fully functional.")
        print("📱 You can now use the mobile app to:")
        print("   • Search for any location worldwide")
        print("   • Get your current location weather")
        print("   • Explore popular tourist destinations")
        print("   • View real NASA satellite data")
        print("   • See beautiful weather animations")
    else:
        print(f"\n⚠️  Some tests failed. Check the API server and NASA credentials.")
    
    print(f"\n🔗 Open the Expo app and scan the QR code to start using the weather app!")
    print(f"🌐 API Documentation: {API_BASE_URL}/docs")

if __name__ == "__main__":
    main()