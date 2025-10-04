"""
NASA Data Access Module
Handles fetching and processing NASA data using xarray and OPeNDAP
"""

import xarray as xr
import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import requests
from requests.auth import HTTPBasicAuth
import aiohttp
import asyncio
from .credentials import nasa_creds

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NASADataAccess:
    """Handles NASA data access via OPeNDAP and other APIs"""
    
    def __init__(self):
        self.credentials = nasa_creds
        self.opendap_urls = self.credentials.get_opendap_urls()
        
        # Set up xarray with authentication if credentials are available
        if self.credentials.has_valid_credentials():
            username, password = self.credentials.get_earthdata_credentials()
            # Configure xarray to use authentication for OPeNDAP
            self._setup_xarray_auth(username, password)
    
    def _setup_xarray_auth(self, username: str, password: str):
        """Setup xarray authentication for OPeNDAP access"""
        try:
            # Create .netrc file for automatic authentication
            self.credentials.create_netrc_file()
            logger.info("Authentication configured for xarray OPeNDAP access")
        except Exception as e:
            logger.error(f"Failed to setup authentication: {e}")
    
    async def get_gpm_precipitation_data(self, 
                                       start_date: str = "2024-01-01", 
                                       end_date: str = "2024-01-07",
                                       lat_range: tuple = (20, 50),
                                       lon_range: tuple = (-130, -60)) -> Dict[str, Any]:
        """
        Fetch GPM (Global Precipitation Measurement) data
        Example OPeNDAP URL for GPM IMERG data
        """
        try:
            # Example GPM IMERG dataset URL (this is a sample structure)
            base_url = self.opendap_urls["gpm"]
            
            # For demonstration, we'll create synthetic GPM-like data
            # In real implementation, you would use actual OPeNDAP URLs
            logger.info("Generating synthetic GPM precipitation data")
            
            # Create synthetic precipitation data
            time_range = pd.date_range(start=start_date, end=end_date, freq='D')
            lat = np.linspace(lat_range[0], lat_range[1], 50)
            lon = np.linspace(lon_range[0], lon_range[1], 100)
            
            # Simulate realistic precipitation patterns
            np.random.seed(42)
            precipitation = np.random.exponential(2.0, (len(time_range), len(lat), len(lon)))
            precipitation = np.where(precipitation > 10, 0, precipitation)  # Some areas with no rain
            
            # Create xarray Dataset
            ds = xr.Dataset(
                {
                    'precipitation': (['time', 'lat', 'lon'], precipitation, {
                        'units': 'mm/hr',
                        'long_name': 'Precipitation Rate',
                        'source': 'GPM IMERG (simulated)'
                    })
                },
                coords={
                    'time': ('time', time_range, {'long_name': 'Time'}),
                    'lat': ('lat', lat, {'units': 'degrees_north', 'long_name': 'Latitude'}),
                    'lon': ('lon', lon, {'units': 'degrees_east', 'long_name': 'Longitude'})
                },
                attrs={
                    'title': 'GPM IMERG Precipitation Data',
                    'source': 'NASA GPM Mission',
                    'created': datetime.now().isoformat()
                }
            )
            
            # Calculate statistics
            stats = {
                'mean_precipitation': float(ds.precipitation.mean().values),
                'max_precipitation': float(ds.precipitation.max().values),
                'total_precipitation': float(ds.precipitation.sum().values),
                'spatial_coverage': {
                    'lat_range': [float(ds.lat.min().values), float(ds.lat.max().values)],
                    'lon_range': [float(ds.lon.min().values), float(ds.lon.max().values)]
                },
                'temporal_coverage': {
                    'start': str(ds.time.min().values),
                    'end': str(ds.time.max().values),
                    'duration_days': len(ds.time)
                }
            }
            
            return {
                'dataset_info': {
                    'dimensions': dict(ds.dims),
                    'variables': list(ds.data_vars.keys()),
                    'coordinates': list(ds.coords.keys()),
                    'attributes': dict(ds.attrs)
                },
                'statistics': stats,
                'sample_data': ds.isel(time=0, lat=slice(0, 5), lon=slice(0, 5)).to_dict(),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error fetching GPM data: {e}")
            return {'error': str(e), 'success': False}
    
    async def get_modis_data(self, 
                           product: str = "MOD11A1",
                           start_date: str = "2024-01-01",
                           region: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Fetch MODIS data (Land Surface Temperature, Vegetation, etc.)
        """
        try:
            if region is None:
                region = {'lat_min': 25, 'lat_max': 50, 'lon_min': -125, 'lon_max': -65}
            
            logger.info(f"Generating synthetic MODIS {product} data")
            
            # Create synthetic MODIS data
            time_range = pd.date_range(start=start_date, periods=16, freq='D')  # 16-day composite
            lat = np.linspace(region['lat_min'], region['lat_max'], 100)
            lon = np.linspace(region['lon_min'], region['lon_max'], 150)
            
            if product == "MOD11A1":  # Land Surface Temperature
                # Simulate LST data (Kelvin)
                base_temp = 290  # ~17°C
                lst_day = base_temp + np.random.normal(0, 10, (len(time_range), len(lat), len(lon)))
                lst_night = base_temp - 10 + np.random.normal(0, 8, (len(time_range), len(lat), len(lon)))
                
                ds = xr.Dataset(
                    {
                        'LST_Day': (['time', 'lat', 'lon'], lst_day, {
                            'units': 'Kelvin',
                            'long_name': 'Land Surface Temperature Day',
                            'scale_factor': 0.02
                        }),
                        'LST_Night': (['time', 'lat', 'lon'], lst_night, {
                            'units': 'Kelvin', 
                            'long_name': 'Land Surface Temperature Night',
                            'scale_factor': 0.02
                        })
                    },
                    coords={
                        'time': time_range,
                        'lat': lat,
                        'lon': lon
                    },
                    attrs={
                        'product': product,
                        'source': 'MODIS Terra',
                        'resolution': '1km'
                    }
                )
            else:
                # Generic MODIS data
                data = np.random.normal(0.5, 0.2, (len(time_range), len(lat), len(lon)))
                ds = xr.Dataset(
                    {
                        'data': (['time', 'lat', 'lon'], data, {
                            'long_name': f'MODIS {product} Data'
                        })
                    },
                    coords={'time': time_range, 'lat': lat, 'lon': lon}
                )
            
            # Calculate statistics
            stats = {}
            for var in ds.data_vars:
                stats[var] = {
                    'mean': float(ds[var].mean().values),
                    'std': float(ds[var].std().values),
                    'min': float(ds[var].min().values),
                    'max': float(ds[var].max().values)
                }
            
            return {
                'product': product,
                'dataset_info': dict(ds.dims),
                'statistics': stats,
                'sample_data': ds.isel(time=0, lat=slice(0, 3), lon=slice(0, 3)).to_dict(),
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error fetching MODIS data: {e}")
            return {'error': str(e), 'success': False}
    
    async def get_ges_disc_catalog(self) -> Dict[str, Any]:
        """
        Get available datasets from GES DISC catalog
        """
        try:
            # This would typically query the GES DISC API
            # For now, we'll return a sample catalog
            catalog = {
                "GPM_IMERG": {
                    "description": "Global Precipitation Measurement Integrated Multi-satellitE Retrievals",
                    "temporal_coverage": "2000-present",
                    "spatial_resolution": "0.1° x 0.1°",
                    "temporal_resolution": "30 minutes, daily, monthly",
                    "opendap_url": f"{self.opendap_urls['gpm']}/GPM_L3/GPM_3IMERGDL/07"
                },
                "MODIS_MOD11A1": {
                    "description": "MODIS/Terra Land Surface Temperature/Emissivity Daily L3 Global 1km",
                    "temporal_coverage": "2000-present", 
                    "spatial_resolution": "1km",
                    "temporal_resolution": "daily",
                    "opendap_url": f"{self.opendap_urls['ges_disc']}/MOST/MOD11A1.061"
                },
                "MERRA2": {
                    "description": "Modern-Era Retrospective analysis for Research and Applications, Version 2",
                    "temporal_coverage": "1980-present",
                    "spatial_resolution": "0.5° x 0.625°",
                    "temporal_resolution": "hourly, daily, monthly",
                    "opendap_url": f"{self.opendap_urls['ges_disc']}/M2T1NXSLV/5.12.4"
                },
                "GRACE": {
                    "description": "Gravity Recovery and Climate Experiment",
                    "temporal_coverage": "2002-2017",
                    "spatial_resolution": "1° x 1°",
                    "temporal_resolution": "monthly",
                    "opendap_url": f"{self.opendap_urls['ges_disc']}/TELLUS_GRAC_L3"
                }
            }
            
            return {
                'catalog': catalog,
                'total_datasets': len(catalog),
                'credentials_status': 'configured' if self.credentials.has_valid_credentials() else 'missing',
                'opendap_servers': self.opendap_urls,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error fetching catalog: {e}")
            return {'error': str(e), 'success': False}
    
    def test_opendap_connection(self, url: str = None) -> Dict[str, Any]:
        """
        Test OPeNDAP connection to NASA servers
        """
        if url is None:
            url = f"{self.opendap_urls['ges_disc']}/contents.html"
        
        try:
            username, password = self.credentials.get_earthdata_credentials()
            
            if username and password:
                auth = HTTPBasicAuth(username, password)
            else:
                auth = None
            
            response = requests.get(url, auth=auth, timeout=30)
            
            return {
                'url': url,
                'status_code': response.status_code,
                'accessible': response.status_code == 200,
                'response_size': len(response.content),
                'headers': dict(response.headers),
                'credentials_used': bool(auth),
                'success': True
            }
            
        except Exception as e:
            return {
                'url': url,
                'error': str(e),
                'accessible': False,
                'success': False
            }

# Global instance
nasa_data = NASADataAccess()