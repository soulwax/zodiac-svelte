<script lang="ts">
	import { page } from '$app/stores';
	
	const siteUrl = $derived($page.url.origin);
	const pageUrl = $derived($page.url.href);
</script>

<svelte:head>
	<title>Zodiac Chart Calculator - Free Birth Chart Analysis | Discover Your Astrological Chart</title>
	<meta name="description" content="Free zodiac birth chart calculator. Discover your sun sign, moon sign, ascendant, planetary positions, and astrological houses. Accurate and detailed astrological analysis." />
	<meta name="keywords" content="zodiac chart, birth chart, astrology calculator, sun sign, moon sign, ascendant, natal chart, astrological chart, horoscope, planetary positions, free astrology" />
	<meta name="author" content="Soulwax" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:title" content="Zodiac Chart Calculator - Free Birth Chart Analysis" />
	<meta property="og:description" content="Calculate your complete zodiac birth chart with detailed astrological analysis. Discover your sun sign, moon sign, ascendant, planetary positions, and house placements." />
	<meta property="og:image" content={`${siteUrl}/favicon.png`} />
	<meta property="og:site_name" content="Zodiac Chart Calculator" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={pageUrl} />
	<meta name="twitter:title" content="Zodiac Chart Calculator - Free Birth Chart Analysis" />
	<meta name="twitter:description" content="Calculate your complete zodiac birth chart with detailed astrological analysis. Discover your sun sign, moon sign, ascendant, and more." />
	<meta name="twitter:image" content={`${siteUrl}/favicon.png`} />
	
	<!-- Additional SEO -->
	<link rel="canonical" href={pageUrl} />
	<meta name="robots" content="index, follow" />
	<meta name="theme-color" content="#ff3e00" />
</svelte:head>

<section>
	<h1>Zodiac Calculator</h1>
	<h2>Discover your sun sign based on your birth details</h2>
	<a href="/zodiac" class="cta-button">Calculate Your Sun Sign</a>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
		text-align: center;
	}

	h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		color: var(--color-text);
	}

	h2 {
		font-size: 1.25rem;
		color: var(--color-text-muted);
		margin-bottom: 2rem;
		font-weight: 400;
	}

	.cta-button {
		display: inline-block;
		padding: 1rem 2rem;
		background: var(--color-theme-1);
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-size: 1.1rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.cta-button:hover {
		background: var(--color-theme-2);
		text-decoration: none;
	}
</style>
