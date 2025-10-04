# NASA App - Expo + FastAPI + xarray + NASA Data Access

This project combines an Expo React Native app with a FastAPI backend that uses xarray for scientific data processing and provides secure access to NASA GES DISC and MODIS data via OPeNDAP.

## Features

- **Expo React Native Frontend**: Cross-platform mobile/web app
- **FastAPI Backend**: High-performance Python API server
- **xarray Integration**: Efficient N-dimensional array processing
- **NASA Data Access**: Secure integration with GES DISC and MODIS
- **OPeNDAP Support**: Direct access to NASA datasets via URLs
- **Credential Management**: Secure storage of NASA Earthdata credentials

## Project Structure

```
nasa-app/
├── App.js                        # Main Expo app component
├── backend/
│   ├── main.py                   # FastAPI server with NASA data access
│   ├── credentials.py            # Secure credential management
│   └── nasa_data.py             # NASA OPeNDAP integration
├── .env                         # Environment variables (credentials)
├── .env.example                 # Template for environment variables
├── requirements.txt             # Python dependencies
├── package.json                 # Node.js dependencies
├── setup_nasa_credentials.py   # Interactive credential setup
├── NASA_DATA_ACCESS.md         # Comprehensive NASA data guide
└── README.md                   # This file
```

## Getting Started

### Prerequisites

- Node.js (for Expo)
- Python 3.8+ (for FastAPI and xarray)
- Expo CLI or Expo Go app on your phone

### Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Python virtual environment is already configured at:**
   ```
   C:/Users/wesly/OneDrive/Documents/Coding/nasa/.venv/
   ```

3. **Install additional Python packages:**
   ```bash
   # Already installed: FastAPI, uvicorn, xarray, numpy, pandas
   # New packages: requests, netcdf4, h5netcdf, aiofiles, python-dotenv
   ```

4. **Set up NASA Earthdata credentials:**
   ```bash
   # Interactive setup (recommended)
   python setup_nasa_credentials.py
   
   # Or manually create .env file with:
   NASA_USERNAME=your_username
   NASA_PASSWORD=your_password
   ```

   **Note**: You need a free NASA Earthdata account: https://urs.earthdata.nasa.gov/users/new

### Running the Application

#### 1. Start the FastAPI Backend

In one terminal, run:
```bash
C:/Users/wesly/OneDrive/Documents/Coding/nasa/.venv/Scripts/python.exe backend/main.py
```

Or using uvicorn directly:
```bash
C:/Users/wesly/OneDrive/Documents/Coding/nasa/.venv/Scripts/uvicorn.exe backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

#### 2. Start the Expo App

In another terminal, run:
```bash
npm start
```

Or for specific platforms:
```bash
npm run android    # For Android
npm run ios        # For iOS (requires macOS)
npm run web        # For web browser
```

## API Endpoints

The FastAPI backend provides several endpoints:

### Core Endpoints
- `GET /` - Root endpoint
- `GET /health` - Health check with xarray version
- `GET /sample-data` - Generate sample climate data using xarray
- `GET /nasa-data-stats` - NASA-like satellite data statistics

### NASA Data Endpoints
- `GET /nasa/auth-status` - Check NASA authentication status
- `GET /nasa/datasets` - List available NASA datasets
- `GET /modis-data` - Access MODIS satellite data via OPeNDAP
- `GET /ges-disc-data` - Access GES DISC datasets (GPM, MERRA2, etc.)

### Example NASA Data Requests
```bash
# MODIS data for New York City
GET /modis-data?lat=40.7&lon=-74.0&start_date=2024-01-01&end_date=2024-01-07

# GPM precipitation data
GET /ges-disc-data?dataset=GPM_3IMERGHH&lat=40.7&lon=-74.0
```

## Features

### FastAPI Backend
- CORS enabled for Expo app communication
- Sample climate/weather data generation using xarray
- NASA-style satellite data simulation
- Statistical analysis of datasets

### Expo Frontend
- API health monitoring
- Data fetching from FastAPI backend
- Display of xarray-processed scientific data
- Responsive UI with data visualization

## Development

### API Documentation
When the FastAPI server is running, visit:
- Interactive API docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

### Adding New Features

1. **Backend**: Add new endpoints in `backend/main.py`
2. **Frontend**: Update `App.js` to consume new API endpoints
3. **Data Processing**: Use xarray in the backend for scientific data operations

## Example Use Cases

This setup is perfect for:
- Climate and weather data analysis
- Satellite data processing
- Scientific research applications
- NASA-style data visualization apps
- Environmental monitoring dashboards

## Technologies Used

- **Frontend**: React Native (Expo)
- **Backend**: FastAPI (Python)
- **Data Processing**: xarray, numpy, pandas
- **Server**: uvicorn (ASGI)

## Notes

- The API runs on localhost:8000 by default
- CORS is configured to allow all origins (change for production)
- Sample data is generated randomly for demonstration
- Real NASA data can be integrated by replacing the sample data generation