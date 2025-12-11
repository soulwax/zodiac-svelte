/**
 * PM2 Ecosystem Configuration
 * 
 * This file defines multiple application configurations for PM2 process manager.
 * Use: pm2 start ecosystem.config.js --env production
 *      pm2 start ecosystem.config.js --env development
 */

module.exports = {
	apps: [
		{
			// Production Configuration
			name: 'stars-ssr-svelte-prod',
			script: 'node',
			args: '.output/server/index.js',
			instances: 'max', // Use all available CPU cores
			exec_mode: 'cluster', // Cluster mode for load balancing
			env: {
				NODE_ENV: 'production',
				PORT: 4332,
				HOST: '0.0.0.0'
			},
			env_production: {
				NODE_ENV: 'production',
				PORT: 4332,
				HOST: '0.0.0.0'
			},
			// Logging Configuration
			error_file: './logs/pm2-error.log',
			out_file: './logs/pm2-out.log',
			log_file: './logs/pm2-combined.log',
			time: true, // Prepend timestamp to logs
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			merge_logs: true, // Merge logs from all instances
			
			// Restart Policy
			autorestart: true,
			max_restarts: 10, // Maximum number of restarts
			min_uptime: '10s', // Minimum uptime before considering app stable
			max_memory_restart: '1G', // Restart if memory exceeds 1GB
			restart_delay: 4000, // Delay between restarts (ms)
			
			// Watch Configuration (disabled in production)
			watch: false,
			ignore_watch: [
				'node_modules',
				'.git',
				'logs',
				'.svelte-kit',
				'build',
				'.output'
			],
			
			// Advanced Options
			kill_timeout: 5000, // Time to wait before force kill
			wait_ready: true, // Wait for ready event
			listen_timeout: 10000, // Timeout for listen event
			shutdown_with_message: true, // Graceful shutdown
			
			// Process Management
			pmx: true, // Enable PMX monitoring
			instance_var: 'INSTANCE_ID', // Environment variable for instance ID
			
			// Source Map Support
			source_map_support: true,
			
			// Health Check
			health_check_grace_period: 3000, // Grace period for health checks
			
			// Cron Restart (optional - uncomment to enable)
			// cron_restart: '0 3 * * *', // Restart daily at 3 AM
		},
		{
			// Development Configuration
			name: 'stars-ssr-svelte-dev',
			script: 'npm',
			args: 'run dev',
			instances: 1,
			exec_mode: 'fork', // Fork mode for development
			env: {
				NODE_ENV: 'development',
				PORT: 4332,
				HOST: '0.0.0.0'
			},
			env_development: {
				NODE_ENV: 'development',
				PORT: 4332,
				HOST: '0.0.0.0'
			},
			// Logging Configuration
			error_file: './logs/pm2-dev-error.log',
			out_file: './logs/pm2-dev-out.log',
			log_file: './logs/pm2-dev-combined.log',
			time: true,
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			merge_logs: true,
			
			// Restart Policy
			autorestart: true,
			max_restarts: 50, // More restarts allowed in dev
			min_uptime: '5s',
			max_memory_restart: '2G',
			restart_delay: 2000,
			
			// Watch Configuration (enabled in development)
			watch: true,
			watch_delay: 1000,
			ignore_watch: [
				'node_modules',
				'.git',
				'logs',
				'.svelte-kit',
				'build',
				'.output',
				'drizzle',
				'*.log'
			],
			
			// Advanced Options
			kill_timeout: 3000,
			wait_ready: false, // Don't wait for ready in dev mode
			listen_timeout: 5000,
			
			// Process Management
			pmx: true,
			
			// Source Map Support
			source_map_support: true,
		},
		{
			// Preview Configuration (for testing production builds locally)
			name: 'stars-ssr-svelte-preview',
			script: 'npm',
			args: 'run preview',
			instances: 1,
			exec_mode: 'fork',
			env: {
				NODE_ENV: 'production',
				PORT: 4332,
				HOST: '0.0.0.0'
			},
			env_preview: {
				NODE_ENV: 'production',
				PORT: 4332,
				HOST: '0.0.0.0'
			},
			// Logging Configuration
			error_file: './logs/pm2-preview-error.log',
			out_file: './logs/pm2-preview-out.log',
			log_file: './logs/pm2-preview-combined.log',
			time: true,
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			merge_logs: true,
			
			// Restart Policy
			autorestart: true,
			max_restarts: 10,
			min_uptime: '10s',
			max_memory_restart: '1G',
			restart_delay: 4000,
			
			// Watch Configuration (disabled for preview)
			watch: false,
			ignore_watch: [
				'node_modules',
				'.git',
				'logs',
				'.svelte-kit',
				'build',
				'.output'
			],
			
			// Advanced Options
			kill_timeout: 5000,
			wait_ready: true,
			listen_timeout: 10000,
			
			// Process Management
			pmx: true,
			
			// Source Map Support
			source_map_support: true,
		}
	],

	// Deployment Configuration (optional)
	deploy: {
		production: {
			user: 'deploy',
			host: ['your-server.com'],
			ref: 'origin/main',
			repo: 'git@github.com:your-username/stars-ssr-svelte.git',
			path: '/var/www/stars-ssr-svelte',
			'pre-deploy-local': '',
			'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
			'pre-setup': '',
			ssh_options: 'StrictHostKeyChecking=no'
		},
		staging: {
			user: 'deploy',
			host: ['staging-server.com'],
			ref: 'origin/develop',
			repo: 'git@github.com:your-username/stars-ssr-svelte.git',
			path: '/var/www/stars-ssr-svelte-staging',
			'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
			ssh_options: 'StrictHostKeyChecking=no'
		}
	}
};
