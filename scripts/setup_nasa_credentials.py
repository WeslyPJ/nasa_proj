#!/usr/bin/env python3
"""
Setup script for NASA GES DISC credentials
This script helps users configure their NASA Earthdata credentials securely.
"""

import os
import getpass
from pathlib import Path

def create_env_file():
    """Create .env file with NASA credentials"""
    print("NASA GES DISC Credential Setup")
    print("=" * 40)
    print("\nTo access NASA data, you need an Earthdata account.")
    print("Register at: https://urs.earthdata.nasa.gov/users/new")
    print("\nThis will create a .env file to store your credentials securely.")
    
    username = input("\nEnter your NASA Earthdata username: ")
    password = getpass.getpass("Enter your NASA Earthdata password: ")
    
    env_content = f"""# NASA Earthdata Login Credentials
# Register at: https://urs.earthdata.nasa.gov/users/new
NASA_USERNAME={username}
NASA_PASSWORD={password}

# Optional: Custom User Agent for requests
NASA_USER_AGENT=foretrip-fastapi/1.0

# GES DISC Base URLs
GES_DISC_BASE_URL=https://disc2.gesdisc.eosdis.nasa.gov/data
MODIS_BASE_URL=https://modis.gsfc.nasa.gov/data/dataprod

# Development settings
DEBUG=True
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("\n✅ .env file created successfully!")
    print("Your credentials are stored securely in the .env file.")
    print("Make sure .env is in your .gitignore file (already added).")

def create_netrc_file():
    """Create .netrc file for NASA authentication"""
    print("\nAlternatively, you can use .netrc for authentication.")
    choice = input("Do you want to create/update .netrc file? (y/n): ").lower()
    
    if choice != 'y':
        return
    
    username = input("Enter your NASA Earthdata username: ")
    password = getpass.getpass("Enter your NASA Earthdata password: ")
    
    home_dir = Path.home()
    netrc_path = home_dir / '.netrc'
    
    netrc_content = f"""
machine urs.earthdata.nasa.gov
    login {username}
    password {password}

machine disc2.gesdisc.eosdis.nasa.gov
    login {username}
    password {password}
"""
    
    if netrc_path.exists():
        with open(netrc_path, 'r') as f:
            existing = f.read()
        
        if 'urs.earthdata.nasa.gov' in existing:
            print("NASA credentials already exist in .netrc")
            overwrite = input("Overwrite existing NASA entries? (y/n): ").lower()
            if overwrite != 'y':
                return
    
    # Append to .netrc
    with open(netrc_path, 'a') as f:
        f.write(netrc_content)
    
    # Set proper permissions on Unix-like systems
    if os.name != 'nt':  # Not Windows
        os.chmod(netrc_path, 0o600)
    
    print(f"\n✅ .netrc file updated at {netrc_path}")

def verify_setup():
    """Verify the setup by testing credential loading"""
    print("\nVerifying setup...")
    
    try:
        from backend.credentials import load_nasa_credentials
        creds = load_nasa_credentials()
        
        if creds and creds.get('username'):
            print("✅ Credentials loaded successfully!")
            print(f"Username: {creds['username']}")
        else:
            print("❌ Failed to load credentials")
            
    except ImportError:
        print("⚠️  Backend modules not found. Make sure you're in the correct directory.")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main setup function"""
    print("NASA Data Access Setup")
    print("=" * 30)
    
    print("\nChoose authentication method:")
    print("1. Environment file (.env) - Recommended")
    print("2. Network credentials (.netrc)")
    print("3. Both")
    
    choice = input("\nEnter your choice (1-3): ")
    
    if choice in ['1', '3']:
        create_env_file()
    
    if choice in ['2', '3']:
        create_netrc_file()
    
    if choice in ['1', '2', '3']:
        verify_setup()
    else:
        print("Invalid choice. Please run the script again.")

if __name__ == "__main__":
    main()