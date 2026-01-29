// File: vite.config.ts

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	server: {
		port: Number(process.env.PORT) || 4332,
		host: true,
		allowedHosts: ['127.0.0.1', 'localhost', 'stars.soulwax.dev', '*.soulwax.dev']
	},
	preview: {
		port: Number(process.env.PORT) || 4332,
		host: true,
		allowedHosts: [
			'127.0.0.1',
			'localhost',
			'stars.soulwax.dev',
			'*.soulwax.dev',
			'starseek.vercel.app',
			'www.starseek.vercel.app'
		]
	}
});
