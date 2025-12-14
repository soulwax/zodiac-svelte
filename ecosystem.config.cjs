module.exports = {
  apps : [{
    name: 'stars-ssr-svelte-prod',
    script: 'build/index.js',
    instances: 1,
    exec_mode: 'fork',
    // Note: SvelteKit automatically loads .env files via $env/dynamic/private
    // If env vars aren't loading, restart PM2: pm2 restart stars-ssr-svelte-prod
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
