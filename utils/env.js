// tiny wrapper with default env vars
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  BROWSER: process.env.BROWSER || 'chrome',
  ENV_HOST: process.env.ENV_HOST || 'xuanta.ai',
};
