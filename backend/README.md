# Backend Configuration

## Environment Variables

The backend uses environment variables for configuration instead of hardcoded values. This provides better security and flexibility for different deployment environments.

### Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` according to your needs:

### Server Configuration

- `API_HOST`: Server host address (default: `0.0.0.0`)
- `API_PORT`: Server port (default: `8001`)
- `LOG_LEVEL`: Logging level (default: `info`)

### API Keys

- `VISUAL_CROSSING_API_KEY`: Get from [Visual Crossing Weather](https://www.visualcrossing.com/weather-api)

### NASA Configuration (Optional)

For NASA data access features:

- `NASA_USERNAME`: Your NASA Earthdata username
- `NASA_PASSWORD`: Your NASA Earthdata password

Register at: https://urs.earthdata.nasa.gov/

### CORS Configuration

- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS (default: `*` for development)

Example: `http://localhost:3000,http://localhost:19006,exp://192.168.1.100:8081`

### Production Deployment

For production:

1. Set `API_HOST` to specific IP or use reverse proxy
2. Configure `ALLOWED_ORIGINS` with specific domains
3. Use strong API keys
4. Set `LOG_LEVEL` to `warning` or `error`

### Local Development

For local development, the defaults work fine:

```bash
# Start the server
python main.py
```

The server will be available at `http://localhost:8001` with API docs at `http://localhost:8001/docs`.