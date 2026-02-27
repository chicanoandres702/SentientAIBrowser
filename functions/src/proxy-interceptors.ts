// Feature: Browser Interceptors | Trace: proxy-scanner.ts
export const INTERCEPTOR_SCRIPT = `
(function() {
  const originalFetch = window.fetch;
  window.fetch = function() {
    return originalFetch.apply(this, arguments);
  };
  // Add more interceptors here as needed (XHR, etc.)
})();
`;
