# NASA Data Access Guide

This guide explains how to securely access NASA GES DISC data using FastAPI and xarray.

## Prerequisites

1. **NASA Earthdata Account**: Register at https://urs.earthdata.nasa.gov/users/new
2. **Python Environment**: Configured with required packages
3. **Network Access**: Ability to connect to NASA servers

## Credential Setup

### Method 1: Environment File (.env) - Recommended

1. Run the setup script:
   ```bash
   python setup_nasa_credentials.py
   ```

2. Or manually create `.env` file:
   ```env
   NASA_USERNAME=your_username
   NASA_PASSWORD=your_password
   NASA_USER_AGENT=nasa-app-fastapi/1.0
   ```

### Method 2: .netrc File

Create `~/.netrc` file:
```
machine urs.earthdata.nasa.gov
    login your_username
    password your_password

machine disc2.gesdisc.eosdis.nasa.gov
    login your_username
    password your_password
```

## Available NASA Datasets

### GES DISC Datasets
- **GPM_3IMERGHH**: Global Precipitation Measurement (30-min)
- **MERRA2**: Modern-Era Retrospective analysis for Research and Applications
- **TRMM**: Tropical Rainfall Measuring Mission
- **AIRS**: Atmospheric Infrared Sounder

### MODIS Datasets
- **MOD11A1**: Land Surface Temperature (Daily)
- **MOD13Q1**: Vegetation Indices (16-day)
- **MOD09A1**: Surface Reflectance (8-day)

## API Endpoints

### Authentication Check
```
GET /nasa/auth-status
```
Returns NASA authentication status.

### MODIS Data
```
GET /modis-data?lat=40.7&lon=-74.0&start_date=2024-01-01&end_date=2024-01-07
```
Parameters:
- `lat`: Latitude (-90 to 90)
- `lon`: Longitude (-180 to 180)
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

### GES DISC Data
```
GET /ges-disc-data?dataset=GPM_3IMERGHH&lat=40.7&lon=-74.0
```
Parameters:
- `dataset`: Dataset name (GPM_3IMERGHH, MERRA2, etc.)
- `lat`: Latitude
- `lon`: Longitude

### Available Datasets
```
GET /nasa/datasets
```
Returns list of available NASA datasets.

## Example Usage

### Python Client
```python
import requests

# Check authentication
response = requests.get("http://localhost:8000/nasa/auth-status")
print(response.json())

# Get MODIS data for New York City
response = requests.get(
    "http://localhost:8000/modis-data",
    params={
        "lat": 40.7128,
        "lon": -74.0060,
        "start_date": "2024-01-01",
        "end_date": "2024-01-07"
    }
)
data = response.json()
```

### JavaScript/React Native
```javascript
// Expo App example
const fetchModisData = async () => {
    const response = await fetch(
        `${API_BASE_URL}/modis-data?lat=40.7&lon=-74.0`
    );
    const data = await response.json();
    return data;
};
```

## Data Processing with xarray

The backend uses xarray for efficient processing of NASA NetCDF data:

```python
import xarray as xr

# Open NASA dataset via OPeNDAP
ds = xr.open_dataset(opendap_url, chunks={'time': 10})

# Select data for specific location
point_data = ds.sel(lat=lat, lon=lon, method='nearest')

# Compute statistics
stats = {
    'mean': float(point_data.mean().values),
    'std': float(point_data.std().values),
    'min': float(point_data.min().values),
    'max': float(point_data.max().values)
}
```

## Troubleshooting

### Authentication Issues

1. **Invalid Credentials**:
   - Verify username/password at https://urs.earthdata.nasa.gov
   - Check .env file formatting
   - Ensure no extra spaces in credentials

2. **Network Issues**:
   - Check firewall settings
   - Verify internet connectivity
   - Test with: `curl -u username:password https://urs.earthdata.nasa.gov/api/users/user`

3. **Permission Denied**:
   - Some datasets require approval
   - Visit dataset page and request access
   - Wait for approval email

### Data Access Issues

1. **Dataset Not Found**:
   - Verify dataset name spelling
   - Check if dataset is available for date range
   - Use `/nasa/datasets` endpoint to list available datasets

2. **Slow Performance**:
   - Use smaller date ranges
   - Implement chunking for large datasets
   - Consider caching frequently accessed data

3. **Memory Issues**:
   - Use xarray's lazy loading with `chunks`
   - Process data in smaller temporal/spatial chunks
   - Implement data streaming for large downloads

## Security Best Practices

1. **Credential Storage**:
   - Never commit .env files to version control
   - Use environment variables in production
   - Rotate credentials periodically

2. **API Security**:
   - Implement rate limiting
   - Use HTTPS in production
   - Validate all user inputs

3. **Data Handling**:
   - Implement proper error handling
   - Log access attempts
   - Cache data to reduce NASA server load

## Production Deployment

1. **Environment Variables**:
   ```bash
   export NASA_USERNAME=your_username
   export NASA_PASSWORD=your_password
   ```

2. **Docker Configuration**:
   ```dockerfile
   ENV NASA_USERNAME=${NASA_USERNAME}
   ENV NASA_PASSWORD=${NASA_PASSWORD}
   ```

3. **Kubernetes Secrets**:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: nasa-credentials
   data:
     username: <base64-encoded-username>
     password: <base64-encoded-password>
   ```

## Resources

- [NASA Earthdata](https://earthdata.nasa.gov/)
- [GES DISC Data](https://disc.gsfc.nasa.gov/)
- [MODIS Data](https://modis.gsfc.nasa.gov/)
- [xarray Documentation](https://xarray.pydata.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)