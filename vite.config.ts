// File: vite.config.ts

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		{
			name: 'wasm-content-type',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url?.endsWith('.wasm')) {
						res.setHeader('Content-Type', 'application/wasm');
					}
					next();
				});
			}
		}
	],
	server: {
		port: Number(process.env.PORT) || 4332,
		host: true,
		allowedHosts: ['127.0.0.1', 'localhost', 'stars.soulwax.dev', '*.soulwax.dev'],
		fs: {
			allow: ['..']
		}
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
			'www.starseek.vercel.app',
			'starpeek.vercel.app',
			'www.starpeek.vercel.app'
		]
	},
	optimizeDeps: {
		exclude: ['swisseph-wasm']
	},
	assetsInclude: ['**/*.wasm', '**/*.data']
});
