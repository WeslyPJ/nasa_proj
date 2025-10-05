"""
Final API and Data Validation Test
Tests all NASA data endpoints and verifies data can be fetched successfully
"""

import requests
import json
import time

def test_endpoint(url, name, timeout=30):
    """Test a single endpoint"""
    try:
        print(f"🧪 Testing {name}...")
        response = requests.get(url, timeout=timeout)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name}: SUCCESS (Status: {response.status_code})")
            return True, data
        else:
            print(f"❌ {name}: FAILED (Status: {response.status_code})")
            return False, None
            
    except Exception as e:
        print(f"❌ {name}: ERROR - {str(e)}")
        return False, None

def main():
    base_url = "http://localhost:8001"
    
    print("🚀 NASA Data API Validation Test")
    print("=" * 50)
    print(f"Base URL: {base_url}")
    print()
    
    # Test all endpoints
    tests = [
        (f"{base_url}/", "Root Endpoint"),
        (f"{base_url}/health", "Health Check"),
        (f"{base_url}/nasa/credentials-status", "NASA Credentials Status"),
        (f"{base_url}/nasa/catalog", "NASA Data Catalog"),
        (f"{base_url}/sample-data", "Sample Climate Data"),
        (f"{base_url}/nasa-data-stats", "NASA Statistics"),
        (f"{base_url}/nasa/modis-data?region=nyc", "MODIS Data (NYC)"),
        (f"{base_url}/nasa/gpm-precipitation", "GPM Precipitation Data"),
    ]
    
    results = []
    
    for url, name in tests:
        success, data = test_endpoint(url, name)
        results.append((name, success, data))
        time.sleep(0.5)  # Small delay between requests
        print()
    
    # Summary
    print("📊 TEST SUMMARY")
    print("=" * 30)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    print()
    
    # Detailed results
    print("📋 DETAILED RESULTS")
    print("-" * 40)
    
    for name, success, data in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status:<8} {name}")
        
        if success and data:
            # Show key information for each endpoint
            if "health" in name.lower():
                print(f"         xarray: {data.get('xarray_version', 'N/A')}")
                print(f"         NASA creds: {data.get('nasa_credentials', 'N/A')}")
                
            elif "credentials" in name.lower():
                print(f"         Has credentials: {data.get('has_credentials', False)}")
                print(f"         Username configured: {data.get('username_configured', False)}")
                
            elif "catalog" in name.lower():
                print(f"         Total datasets: {data.get('total_datasets', 0)}")
                
            elif "modis" in name.lower():
                print(f"         Product: {data.get('product', 'N/A')}")
                print(f"         Success: {data.get('success', False)}")
                
            elif "gpm" in name.lower():
                print(f"         Dataset: {data.get('dataset_info', {}).get('product', 'N/A')}")
                print(f"         Success: {data.get('success', False)}")
        
        print()
    
    # Final assessment
    if passed == total:
        print("🎉 ALL TESTS PASSED! API is fully functional.")
        print("🛰️ NASA data access is working correctly.")
        print("📱 Expo app should be able to fetch all data successfully.")
    else:
        print(f"⚠️  {total-passed} tests failed. Check the issues above.")
    
    print()
    print("🔗 API Documentation: http://localhost:8001/docs")
    print("🌐 Frontend URL: Update App.js to use http://localhost:8001")

if __name__ == "__main__":
    main()