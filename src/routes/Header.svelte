<!-- File: src/routes/Header.svelte -->

<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import github from '$lib/images/github.svg';
</script>

<header>
	<div class="corner">
		<div
			class="logo-container relative flex items-center justify-center"
			style="width: 120px; height: 120px;"
		>
			<div
				class="absolute inset-0 w-full h-full rounded-full border-2 animate-spin-slow"
				style="border-color: transparent; border-top-color: rgb(20, 184, 166); border-right-color: rgba(20, 184, 166, 0.3);"
			></div>
			<div class="relative z-10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="66"
					height="66"
					viewBox="0 0 100 100"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-teal-400"
				>
					<path d="M 50 10 L 80 30 L 80 70 L 50 90 L 20 70 L 20 30 Z"></path>
					<line x1="50" y1="20" x2="50" y2="80"></line>
					<circle cx="50" cy="50" r="10"></circle>
					<circle cx="50" cy="10" r="3" fill="currentColor"></circle>
					<circle cx="50" cy="90" r="3" fill="currentColor"></circle>
				</svg>
			</div>
			<div
				class="absolute -top-0.5 -right-0.5 text-teal-400 pointer-events-none opacity-60"
				style="font-size: 18px;"
			>
				✨
			</div>
		</div>
	</div>

	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			<li aria-current={page.url.pathname === '/' ? 'page' : undefined}>
				<a href={resolve('/')}>Home</a>
			</li>
			<li aria-current={page.url.pathname === '/zodiac' ? 'page' : undefined}>
				<a href={resolve('/zodiac')}>Zodiac</a>
			</li>
			<li aria-current={page.url.pathname === '/about' ? 'page' : undefined}>
				<a href={resolve('/about')}>About</a>
			</li>
			<li aria-current={page.url.pathname.startsWith('/sverdle') ? 'page' : undefined}>
				<a href={resolve('/sverdle')}>Sverdle</a>
			</li>
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>

	<div class="corner">
		<a href="https://github.com/soulwax/zodiac-svelte">
			<img src={github} alt="GitHub" />
		</a>
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	.corner {
		width: 3em;
		height: 3em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}

	.logo-container {
		transform: scale(0.25);
		transform-origin: center;
	}

	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin-slow {
		animation: spin-slow 3s linear infinite;
	}

	nav {
		display: flex;
		justify-content: center;
		--background: var(--color-bg-2);
	}

	svg {
		width: 2em;
		height: 3em;
		display: block;
	}

	path {
		fill: var(--background);
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover {
		color: var(--color-theme-1);
	}
</style>
