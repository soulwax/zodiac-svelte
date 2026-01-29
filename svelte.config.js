// File: svelte.config.js

import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto automatically detects Vercel and uses the correct adapter
		adapter: adapter(),
		csrf: {
			trustedOrigins: ['https://starseek.vercel.app']
		}
	}
};

export default config;
