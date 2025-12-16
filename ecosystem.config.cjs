module.exports = {
  apps : [{
    name: 'stars-ssr-svelte-prod',
    script: './build/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 4332
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 4332
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: process.env.PORT || 4332
    },
    env_preview: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 4332
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
