// Load .env file manually
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          // Remove quotes if present
          let value = valueParts.join('=').trim();
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          envVars[key.trim()] = value;
        }
      }
    });
    return envVars;
  }
  return {};
}

const envVars = loadEnvFile();

module.exports = {
  apps : [{
    name: 'stars-ssr-svelte-prod',
    script: 'build/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || envVars.PORT || 4332,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || envVars.PERPLEXITY_API_KEY,
      DATABASE_URL: process.env.DATABASE_URL || envVars.DATABASE_URL
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || envVars.PORT || 4332,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || envVars.PERPLEXITY_API_KEY,
      DATABASE_URL: process.env.DATABASE_URL || envVars.DATABASE_URL
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: process.env.PORT || envVars.PORT || 4332,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || envVars.PERPLEXITY_API_KEY,
      DATABASE_URL: process.env.DATABASE_URL || envVars.DATABASE_URL
    },
    env_preview: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || envVars.PORT || 4332,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || envVars.PERPLEXITY_API_KEY,
      DATABASE_URL: process.env.DATABASE_URL || envVars.DATABASE_URL
    },
    watch: false,
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
