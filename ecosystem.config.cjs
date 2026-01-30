// File: ecosystem.config.cjs
// ecosystem.config.js for a sveltekit project using pm2

module.exports = {
	apps: [
		{
			name: 'zodiac-svelte',
			script: 'node_modules/.bin/svelte-kit',
			args: 'start',
			env: {
				NODE_ENV: 'production',
				PORT: process.env.PORT || 4332
			}
		}
	]
};
