const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable strict cross-origin isolation headers for the web bundler.
// Expo 50+ forces COOP/COEP for multithreading features, but this instantly 
// crashes window.opener workflows like Firebase's signInWithPopup.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // Allow popups to communicate with the origin window
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
      
      // Let existing Expo middleware handle the rest
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
