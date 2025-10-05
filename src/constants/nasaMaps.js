// NASA Map Sources Configuration
export const NASA_MAP_SOURCES = {
  // NASA MODIS Terra True Color
  MODIS_TERRA: {
    name: 'MODIS Terra True Color',
    urlTemplate: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{max_zoom}/{z}/{y}/{x}.jpg',
    attribution: '© NASA MODIS Terra',
    maxZoom: 9,
    tileSize: 256,
  },
  
  // NASA MODIS Aqua True Color
  MODIS_AQUA: {
    name: 'MODIS Aqua True Color',
    urlTemplate: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0/MODIS_Aqua_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{max_zoom}/{z}/{y}/{x}.jpg',
    attribution: '© NASA MODIS Aqua',
    maxZoom: 9,
    tileSize: 256,
  },
  
  // NASA Earth at Night (Black Marble)
  BLACK_MARBLE: {
    name: 'Earth at Night',
    urlTemplate: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png',
    attribution: '© NASA Black Marble',
    maxZoom: 8,
    tileSize: 256,
  },
  
  // NASA Land Surface Temperature
  LAND_TEMP: {
    name: 'Land Surface Temperature',
    urlTemplate: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0/MODIS_Terra_Land_Surface_Temp_Day/default/{time}/{tilematrixset}{max_zoom}/{z}/{y}/{x}.png',
    attribution: '© NASA MODIS Land Temperature',
    maxZoom: 7,
    tileSize: 256,
  },
  
  // NASA Precipitation
  PRECIPITATION: {
    name: 'Global Precipitation',
    urlTemplate: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0/GPM_3IMERGHH_06_precipitation/default/{time}/{tilematrixset}{max_zoom}/{z}/{y}/{x}.png',
    attribution: '© NASA GPM Precipitation',
    maxZoom: 6,
    tileSize: 256,
  },
  
  // NASA Blue Marble
  BLUE_MARBLE: {
    name: 'Blue Marble',
    urlTemplate: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0/BlueMarble_NextGeneration/default/2004-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
    attribution: '© NASA Blue Marble',
    maxZoom: 8,
    tileSize: 256,
  }
};

// Helper function to get current date for NASA WMTS
export const getCurrentNASADate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1); // Use yesterday's data as today might not be available
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Helper function to build NASA tile URL
export const buildNASATileURL = (source, z, x, y, date = null) => {
  const currentDate = date || getCurrentNASADate();
  return source.urlTemplate
    .replace('{time}', currentDate)
    .replace('{tilematrixset}', 'GoogleMapsCompatible_Level')
    .replace('{max_zoom}', source.maxZoom.toString())
    .replace('{z}', z.toString())
    .replace('{y}', y.toString())
    .replace('{x}', x.toString());
};

// Map style configurations for different NASA layers
export const NASA_MAP_STYLES = {
  SATELLITE: 'MODIS_TERRA',
  NIGHT: 'BLACK_MARBLE',
  TEMPERATURE: 'LAND_TEMP',
  PRECIPITATION: 'PRECIPITATION',
  EARTH: 'BLUE_MARBLE'
};