module.exports = {
  apps: [{
    name: 'immigration-api',
    script: './dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 5000,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/?retryWrites=true&w=majority&appName=RCICDB',
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      FRONTEND_URL: process.env.FRONTEND_URL,
      NEW_RELIC_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY,
      NEW_RELIC_APP_NAME: process.env.NEW_RELIC_APP_NAME,
      NEW_RELIC_ENABLED: process.env.NEW_RELIC_ENABLED
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
