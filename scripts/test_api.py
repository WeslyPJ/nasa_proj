import requests
import json
import time

# Wait for server to start
time.sleep(2)

base_url = "http://localhost:8001"

print("🧪 Testing NASA API Endpoints")
print("=" * 40)

# Test 1: Root endpoint
try:
    response = requests.get(f"{base_url}/")
    print(f"✅ Root endpoint: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"❌ Root endpoint failed: {e}")

print()

# Test 2: Health check
try:
    response = requests.get(f"{base_url}/health")
    print(f"✅ Health check: {response.status_code}")
    data = response.json()
    print(f"   Status: {data.get('status')}")
    print(f"   xarray version: {data.get('xarray_version')}")
except Exception as e:
    print(f"❌ Health check failed: {e}")

print()

# Test 3: NASA Auth Status
try:
    response = requests.get(f"{base_url}/nasa/auth-status")
    print(f"✅ NASA auth status: {response.status_code}")
    data = response.json()
    print(f"   Authentication: {data.get('authenticated')}")
    print(f"   Username: {data.get('username')}")
except Exception as e:
    print(f"❌ NASA auth status failed: {e}")

print()

# Test 4: NASA Datasets
try:
    response = requests.get(f"{base_url}/nasa/datasets")
    print(f"✅ NASA datasets: {response.status_code}")
    data = response.json()
    print(f"   Total datasets: {data.get('total_datasets')}")
    print(f"   Available: {list(data.get('catalog', {}).keys())}")
except Exception as e:
    print(f"❌ NASA datasets failed: {e}")

print()

# Test 5: MODIS Data
try:
    response = requests.get(f"{base_url}/modis-data?lat=40.7&lon=-74.0", timeout=30)
    print(f"✅ MODIS data: {response.status_code}")
    data = response.json()
    print(f"   Product: {data.get('product')}")
    print(f"   Variables: {data.get('variables', [])}")
    print(f"   Success: {data.get('success')}")
except Exception as e:
    print(f"❌ MODIS data failed: {e}")

print()

# Test 6: GES DISC Data
try:
    response = requests.get(f"{base_url}/ges-disc-data?dataset=GPM_3IMERGHH", timeout=30)
    print(f"✅ GES DISC data: {response.status_code}")
    data = response.json()
    print(f"   Dataset: {data.get('dataset_info', {}).get('name')}")
    print(f"   Variables: {data.get('variables', [])}")
    print(f"   Success: {data.get('success')}")
except Exception as e:
    print(f"❌ GES DISC data failed: {e}")

print()
print("🎉 API Testing Complete!")