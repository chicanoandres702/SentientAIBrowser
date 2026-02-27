"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERCEPTOR_SCRIPT = void 0;
// Feature: Browser Interceptors | Trace: proxy-scanner.ts
exports.INTERCEPTOR_SCRIPT = `
(function() {
  const originalFetch = window.fetch;
  window.fetch = function() {
    return originalFetch.apply(this, arguments);
  };
  // Add more interceptors here as needed (XHR, etc.)
})();
`;
//# sourceMappingURL=proxy-interceptors.js.map