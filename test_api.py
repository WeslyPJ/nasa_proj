import requests
import json

def test_weather_api():
    """Test the weather API endpoints"""
    base_url = "http://localhost:8001"
    
    print("🧪 Testing ForeTrip Weather API...")
    print("=" * 50)
    
    # Test health endpoint
    try:
        print("\n1. Testing /health endpoint...")
        response = requests.get(f"{base_url}/health")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error connecting to health endpoint: {e}")
    
    # Test weather endpoint
    try:
        print("\n2. Testing /weather endpoint...")
        params = {
            'lat': 40.7128,
            'lon': -74.0060,
            'location_name': 'New York City'
        }
        response = requests.get(f"{base_url}/weather", params=params)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Location: {data.get('location', {}).get('name', 'Unknown')}")
            print(f"Temperature: {data.get('current', {}).get('temperature', 'N/A')}°C")
            print(f"Condition: {data.get('current', {}).get('condition', 'N/A')}")
            print(f"Humidity: {data.get('current', {}).get('humidity', 'N/A')}%")
            print("✅ Weather data retrieved successfully!")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error connecting to weather endpoint: {e}")
    
    # Test root endpoint
    try:
        print("\n3. Testing root endpoint...")
        response = requests.get(f"{base_url}/")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error connecting to root endpoint: {e}")

if __name__ == "__main__":
    test_weather_api()