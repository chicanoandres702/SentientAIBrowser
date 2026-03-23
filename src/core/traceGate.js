// Sentient Trace Gate Debug Logger
// Usage: traceGate(__filename, ...args)
module.exports = function traceGate(file, ...args) {
  if (process.env.TRACE_GATE === 'true') {
    console.debug(`[TRACE_GATE][${file}]`, ...args);
  }
};
