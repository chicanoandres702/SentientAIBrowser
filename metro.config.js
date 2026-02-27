const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
module.exports = config;

// Note: The custom middleware for COOP/COEP headers was removed.
// It was causing a "Body has already been read" error during Metro startup
// by conflicting with Expo's internal API requests. If these headers are needed
// for specific proxy responses, they should be added within the proxy logic itself.
