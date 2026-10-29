const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes window
const maxRequestsPerWindow = 100; // max requests per IP in the window
const ipRequestLogs = new Map();

/**
 * A custom memory-based rate limiting middleware.
 * Prevents DDoS and brute-force attacks on authentication/verification endpoints.
 */
function rateLimiter(req, res, next) {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();
  
  if (!ipRequestLogs.has(ip)) {
    ipRequestLogs.set(ip, []);
  }
  
  // Filter out request timestamps older than the window
  const requestTimestamps = ipRequestLogs.get(ip).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs
  );
  
  if (requestTimestamps.length >= maxRequestsPerWindow) {
    return res.status(429).json({
      error: "Too many requests originating from this IP address. Please try again in 15 minutes."
    });
  }
  
  // Log current request
  requestTimestamps.push(now);
  ipRequestLogs.set(ip, requestTimestamps);
  
  next();
}

module.exports = rateLimiter;
