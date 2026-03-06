// SentientLogger: Comprehensive trace and error logger
// Usage: sentientLogger.trace(file, ...args), sentientLogger.error(file, ...args)
const sentientLogger = {
  trace(file, ...args) {
    if (process.env.TRACE_GATE === 'true') {
      console.debug(`[TRACE][${file}]`, ...args);
    }
  },
  error(file, ...args) {
    // Always log errors, optionally send to external service
    console.error(`[ERROR][${file}]`, ...args);
    // TODO: Integrate with external error tracking (Sentry, etc.)
  }
};
module.exports = sentientLogger;
