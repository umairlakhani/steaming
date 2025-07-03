const redisConfig = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  };

  // Check if TLS should be enabled
const enableTLS = process.env.ENABLE_REDIS_TLS === 'true';

// Conditionally add TLS block
if (enableTLS) {
  redisConfig.tls = {
    // Enable TLS
    rejectUnauthorized: false,
  };
}
module.exports=redisConfig  