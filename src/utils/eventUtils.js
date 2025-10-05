// Event Handling Best Practices for React Native
// This file contains utilities and patterns to avoid synthetic event warnings

/**
 * Extract coordinate data from map events immediately to avoid synthetic event issues
 * Use this when you need to access coordinate data in async functions or callbacks
 */
export const extractCoordinate = (event) => {
  if (event && event.nativeEvent && event.nativeEvent.coordinate) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    return { latitude, longitude };
  }
  return null;
};

/**
 * Create a new event object with extracted data for use in async contexts
 * This prevents "synthetic event" warnings when passing events to callbacks
 */
export const createCoordinateEvent = (latitude, longitude) => ({
  nativeEvent: {
    coordinate: { latitude, longitude }
  }
});

/**
 * Safe event handler wrapper that extracts event data immediately
 * Use this for map press events that need to be used asynchronously
 */
export const createSafeMapPressHandler = (handler) => {
  return (event) => {
    const coordinate = extractCoordinate(event);
    if (coordinate && handler) {
      handler(coordinate);
    }
  };
};

/**
 * Safe text input handler that immediately extracts the text value
 * Use this for search inputs or other text fields with async processing
 */
export const createSafeTextHandler = (handler) => {
  return (text) => {
    // Text inputs don't have synthetic event issues, but this ensures consistency
    if (handler) {
      handler(text);
    }
  };
};

/**
 * Alternative approach: If you still get warnings, you can use event.persist()
 * Only use this if the above methods don't work
 */
export const persistEvent = (event) => {
  if (event && event.persist) {
    event.persist();
  }
  return event;
};

// Example usage patterns:

/*
// Instead of this (which can cause warnings):
const onMapPress = async (event) => {
  // This might cause synthetic event warning if event is accessed later
  await someAsyncFunction();
  const { latitude, longitude } = event.nativeEvent.coordinate;
};

// Use this:
const onMapPress = async (event) => {
  const { latitude, longitude } = event.nativeEvent.coordinate;
  await someAsyncFunction(latitude, longitude);
};

// Or this with utility:
const onMapPress = createSafeMapPressHandler(async (coordinate) => {
  await someAsyncFunction(coordinate.latitude, coordinate.longitude);
});
*/