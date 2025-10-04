"""
NASA/GES DISC Credentials Management
Handles secure storage and retrieval of NASA Earthdata credentials
"""

import os
import logging
from pathlib import Path
from typing import Optional, Tuple
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NASACredentials:
    """Manages NASA Earthdata and GES DISC credentials securely"""
    
    def __init__(self):
        self.load_credentials()
    
    def load_credentials(self):
        """Load credentials from .env file and environment variables"""
        # Load .env file if it exists
        env_path = Path(__file__).parent.parent / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            logger.info("Loaded credentials from .env file")
        else:
            logger.warning(".env file not found, using environment variables only")
        
        # Load credentials from environment
        self.nasa_username = os.getenv('NASA_USERNAME')
        self.nasa_password = os.getenv('NASA_PASSWORD')
        self.ges_disc_username = os.getenv('GES_DISC_USERNAME', self.nasa_username)
        self.ges_disc_password = os.getenv('GES_DISC_PASSWORD', self.nasa_password)
        self.nasa_api_key = os.getenv('NASA_API_KEY')
        
        # OPeNDAP URLs
        self.nasa_opendap_base = os.getenv('NASA_OPENDAP_BASE_URL', 
                                          'https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap')
        self.ges_disc_opendap = os.getenv('GES_DISC_OPENDAP_URL', 
                                         'https://goldsmr4.gesdisc.eosdis.nasa.gov/opendap')
    
    def get_earthdata_credentials(self) -> Tuple[Optional[str], Optional[str]]:
        """Get NASA Earthdata credentials"""
        return self.nasa_username, self.nasa_password
    
    def get_ges_disc_credentials(self) -> Tuple[Optional[str], Optional[str]]:
        """Get GES DISC credentials"""
        return self.ges_disc_username, self.ges_disc_password
    
    def has_valid_credentials(self) -> bool:
        """Check if valid credentials are available"""
        return bool(self.nasa_username and self.nasa_password)
    
    def create_netrc_file(self) -> bool:
        """Create .netrc file for automatic authentication"""
        if not self.has_valid_credentials():
            logger.error("No valid credentials found")
            return False
        
        netrc_path = Path.home() / '.netrc'
        
        # Check if .netrc already exists and has NASA entries
        netrc_content = ""
        if netrc_path.exists():
            with open(netrc_path, 'r') as f:
                netrc_content = f.read()
        
        # NASA Earthdata entries
        earthdata_entries = [
            "urs.earthdata.nasa.gov",
            "goldsmr4.gesdisc.eosdis.nasa.gov",
            "gpm1.gesdisc.eosdis.nasa.gov",
            "disc2.gesdisc.eosdis.nasa.gov"
        ]
        
        # Add entries if they don't exist
        updated = False
        for host in earthdata_entries:
            if host not in netrc_content:
                netrc_content += f"\nmachine {host}\n"
                netrc_content += f"login {self.nasa_username}\n"
                netrc_content += f"password {self.nasa_password}\n"
                updated = True
        
        if updated:
            try:
                with open(netrc_path, 'w') as f:
                    f.write(netrc_content)
                
                # Set proper permissions (readable only by owner)
                os.chmod(netrc_path, 0o600)
                logger.info(f"Updated .netrc file at {netrc_path}")
                return True
            except Exception as e:
                logger.error(f"Failed to create .netrc file: {e}")
                return False
        else:
            logger.info(".netrc file already contains NASA entries")
            return True
    
    def get_opendap_urls(self) -> dict:
        """Get available OPeNDAP server URLs"""
        return {
            "ges_disc": self.ges_disc_opendap,
            "nasa_base": self.nasa_opendap_base,
            "gpm": "https://gpm1.gesdisc.eosdis.nasa.gov/opendap",
            "disc2": "https://disc2.gesdisc.eosdis.nasa.gov/opendap"
        }

# Global instance
nasa_creds = NASACredentials()

def load_nasa_credentials() -> dict:
    """
    Load NASA credentials for backward compatibility
    Returns a dictionary with username, password, and other credentials
    """
    return {
        'username': nasa_creds.nasa_username,
        'password': nasa_creds.nasa_password,
        'api_key': nasa_creds.nasa_api_key,
        'opendap_urls': nasa_creds.get_opendap_urls(),
        'has_valid_creds': nasa_creds.has_valid_credentials()
    }