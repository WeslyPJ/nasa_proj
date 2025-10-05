"""
NASA Credentials and Configuration Management
Handles NASA Earthdata login credentials and OPeNDAP URLs
"""

import os
import logging
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)

class NASACredentials:
    """Manages NASA Earthdata credentials and configuration"""
    
    def __init__(self):
        self.username = os.getenv('NASA_USERNAME')
        self.password = os.getenv('NASA_PASSWORD')
        
        # OPeNDAP server URLs
        self.opendap_urls = {
            'ges_disc': os.getenv('NASA_GES_DISC_URL', 'https://disc.gsfc.nasa.gov/opendap'),
            'gpm': os.getenv('NASA_GPM_URL', 'https://gpm1.gesdisc.eosdis.nasa.gov/opendap'),
            'modis': os.getenv('NASA_MODIS_URL', 'https://ladsweb.modaps.eosdis.nasa.gov/opendap'),
            'earthdata': os.getenv('NASA_EARTHDATA_URL', 'https://urs.earthdata.nasa.gov')
        }
    
    def has_valid_credentials(self) -> bool:
        """Check if valid NASA Earthdata credentials are available"""
        return bool(self.username and self.password)
    
    def get_earthdata_credentials(self) -> Tuple[Optional[str], Optional[str]]:
        """Get NASA Earthdata username and password"""
        return self.username, self.password
    
    def get_opendap_urls(self) -> Dict[str, str]:
        """Get configured OPeNDAP server URLs"""
        return self.opendap_urls
    
    def create_netrc_file(self) -> bool:
        """Create .netrc file for automatic authentication with NASA servers"""
        if not self.has_valid_credentials():
            logger.warning("No NASA credentials available for .netrc creation")
            return False
        
        try:
            import os
            from pathlib import Path
            
            netrc_path = Path.home() / '.netrc'
            
            # Read existing .netrc content
            existing_content = []
            if netrc_path.exists():
                with open(netrc_path, 'r') as f:
                    existing_content = f.readlines()
            
            # NASA Earthdata hosts that need authentication
            nasa_hosts = [
                'urs.earthdata.nasa.gov',
                'disc.gsfc.nasa.gov',
                'gpm1.gesdisc.eosdis.nasa.gov',
                'ladsweb.modaps.eosdis.nasa.gov'
            ]
            
            # Check if NASA entries already exist
            has_nasa_entries = any(host in ''.join(existing_content) for host in nasa_hosts)
            
            if not has_nasa_entries:
                with open(netrc_path, 'a') as f:
                    f.write('\n# NASA Earthdata Login\n')
                    for host in nasa_hosts:
                        f.write(f'machine {host}\n')
                        f.write(f'    login {self.username}\n')
                        f.write(f'    password {self.password}\n\n')
                
                # Set appropriate permissions (readable only by user)
                os.chmod(netrc_path, 0o600)
                logger.info("Created .netrc file with NASA Earthdata credentials")
                return True
            else:
                logger.info(".netrc file already contains NASA entries")
                return True
                
        except Exception as e:
            logger.error(f"Failed to create .netrc file: {e}")
            return False
    
    def test_credentials(self) -> Dict[str, any]:
        """Test NASA Earthdata credentials"""
        if not self.has_valid_credentials():
            return {
                'valid': False,
                'error': 'No credentials configured',
                'message': 'Set NASA_USERNAME and NASA_PASSWORD environment variables'
            }
        
        try:
            # Use aiohttp instead of requests since it's already in requirements
            import aiohttp
            import asyncio
            import base64
            
            async def test_auth():
                # Create basic auth header
                credentials = f"{self.username}:{self.password}"
                encoded_credentials = base64.b64encode(credentials.encode()).decode()
                headers = {"Authorization": f"Basic {encoded_credentials}"}
                
                # Test login endpoint
                auth_url = f"{self.opendap_urls['earthdata']}/oauth/authorize"
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(auth_url, headers=headers, timeout=10, allow_redirects=False) as response:
                        return {
                            'valid': response.status in [200, 302],
                            'status_code': response.status,
                            'message': 'Credentials are valid' if response.status in [200, 302] else 'Invalid credentials'
                        }
            
            # Run the async test
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(test_auth())
            loop.close()
            return result
            
        except Exception as e:
            return {
                'valid': False,
                'error': str(e),
                'message': 'Failed to test credentials'
            }

# Global instance
nasa_creds = NASACredentials()