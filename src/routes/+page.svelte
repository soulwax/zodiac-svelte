<!-- File: src/routes/+page.svelte -->

<script lang="ts">
	import { page } from '$app/stores';
	import {
		calculateAllPlanets,
		calculateAscendant,
		calculateHouses,
		calculateMoonSign,
		calculateSunSign
	} from '$lib/zodiac';
	import Chart from './zodiac/Chart.svelte';

	const siteUrl = $derived($page.url.origin);
	const pageUrl = $derived($page.url.href);

	// Sample chart data for demonstration
	// Using January 1, 2000, 12:00 PM UTC in New York (40.7128°N, 74.0060°W)
	const sampleYear = 2000;
	const sampleMonth = 1;
	const sampleDay = 1;
	const sampleHour = 12;
	const sampleMinute = 0;
	const sampleLat = 40.7128;
	const sampleLon = -74.006;

	// Calculate sample chart data
	const sampleSunSign = calculateSunSign(sampleMonth, sampleDay, sampleYear);
	const sampleMoonSign = calculateMoonSign(
		sampleYear,
		sampleMonth,
		sampleDay,
		sampleHour,
		sampleMinute
	);
	const sampleAscendant = calculateAscendant(
		sampleYear,
		sampleMonth,
		sampleDay,
		sampleHour,
		sampleMinute,
		sampleLat,
		sampleLon
	);
	const sampleHouses = calculateHouses(
		sampleYear,
		sampleMonth,
		sampleDay,
		sampleHour,
		sampleMinute,
		sampleLat,
		sampleLon
	);
	const samplePlanets = calculateAllPlanets(
		sampleYear,
		sampleMonth,
		sampleDay,
		sampleHour,
		sampleMinute
	);
</script>

<svelte:head>
	<title
		>Zodiac Chart Calculator - Free Birth Chart Analysis | Discover Your Astrological Chart</title
	>
	<meta
		name="description"
		content="Free zodiac birth chart calculator. Discover your sun sign, moon sign, ascendant, planetary positions, and astrological houses. Accurate and detailed astrological analysis."
	/>
	<meta
		name="keywords"
		content="zodiac chart, birth chart, astrology calculator, sun sign, moon sign, ascendant, natal chart, astrological chart, horoscope, planetary positions, free astrology"
	/>
	<meta name="author" content="Soulwax" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:title" content="Zodiac Chart Calculator - Free Birth Chart Analysis" />
	<meta
		property="og:description"
		content="Calculate your complete zodiac birth chart with detailed astrological analysis. Discover your sun sign, moon sign, ascendant, planetary positions, and house placements."
	/>
	<meta property="og:image" content={`${siteUrl}/favicon.png`} />
	<meta property="og:site_name" content="Zodiac Chart Calculator" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={pageUrl} />
	<meta name="twitter:title" content="Zodiac Chart Calculator - Free Birth Chart Analysis" />
	<meta
		name="twitter:description"
		content="Calculate your complete zodiac birth chart with detailed astrological analysis. Discover your sun sign, moon sign, ascendant, and more."
	/>
	<meta name="twitter:image" content={`${siteUrl}/favicon.png`} />

	<!-- Additional SEO -->
	<link rel="canonical" href={pageUrl} />
	<meta name="robots" content="index, follow" />
	<meta name="theme-color" content="#ff3e00" />
</svelte:head>

<section class="hero">
	<div class="hero-content">
		<h1>Zodiac Chart Calculator</h1>
		<p class="hero-subtitle">
			Discover the cosmic blueprint of your birth chart with precise astrological calculations
		</p>
		<p class="hero-description">
			Unlock the secrets of your astrological identity by calculating your complete birth chart. Our
			free calculator provides detailed insights into your sun sign, moon sign, ascendant (rising
			sign), planetary positions, and astrological houses. Each celestial body's placement reveals
			unique aspects of your personality, relationships, and life path.
		</p>
		<div class="features">
			<div class="feature">
				<div class="feature-icon">☀️</div>
				<div class="feature-text">
					<strong>Sun Sign</strong>
					<span>Your core identity and ego expression</span>
				</div>
			</div>
			<div class="feature">
				<div class="feature-icon">🌙</div>
				<div class="feature-text">
					<strong>Moon Sign</strong>
					<span>Your emotional nature and inner needs</span>
				</div>
			</div>
			<div class="feature">
				<div class="feature-icon">⬆️</div>
				<div class="feature-text">
					<strong>Ascendant</strong>
					<span>Your rising sign and outward personality</span>
				</div>
			</div>
			<div class="feature">
				<div class="feature-icon">🪐</div>
				<div class="feature-text">
					<strong>All Planets</strong>
					<span>Complete planetary positions and houses</span>
				</div>
			</div>
		</div>
		<a href="/zodiac" class="cta-button">Calculate Your Birth Chart</a>
	</div>
</section>

<section class="sample-chart">
	<div class="sample-content">
		<h2>Sample Planetary Constellation</h2>
		<p class="sample-description">
			Below is an example birth chart showing how planetary positions are displayed. This sample
			chart represents January 1, 2000 at 12:00 PM in New York City. Each planet's position in the
			zodiac signs and houses is calculated with astronomical precision.
		</p>
		<div class="sample-info">
			<div class="sample-info-item">
				<strong>Sample Date:</strong> January 1, 2000
			</div>
			<div class="sample-info-item">
				<strong>Sample Time:</strong> 12:00 PM UTC
			</div>
			<div class="sample-info-item">
				<strong>Sample Location:</strong> New York City, USA
			</div>
			<div class="sample-info-item">
				<strong>Sun Sign:</strong>
				{sampleSunSign}
			</div>
			<div class="sample-info-item">
				<strong>Moon Sign:</strong>
				{sampleMoonSign}
			</div>
			<div class="sample-info-item">
				<strong>Ascendant:</strong>
				{sampleAscendant}
			</div>
		</div>
		<div class="chart-wrapper">
			<Chart
				sunSign={sampleSunSign}
				ascendant={sampleAscendant}
				moonSign={sampleMoonSign}
				houses={sampleHouses}
				planets={samplePlanets}
				utcYear={sampleYear}
				utcMonth={sampleMonth}
				utcDay={sampleDay}
				utcHour={sampleHour}
				utcMinute={sampleMinute}
			/>
		</div>
	</div>
</section>

<style>
	.hero {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
		text-align: center;
		padding: 3rem 1rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.hero-content {
		width: 100%;
	}

	h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		color: var(--color-text);
		background: linear-gradient(135deg, var(--color-theme-1), var(--color-theme-2));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		font-size: 1.5rem;
		color: var(--color-text);
		margin-bottom: 1rem;
		font-weight: 500;
	}

	.hero-description {
		font-size: 1.1rem;
		color: var(--color-text-muted);
		margin-bottom: 2.5rem;
		line-height: 1.7;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2.5rem;
		padding: 2rem;
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}

	.feature {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-bg-1);
		border-radius: 8px;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.feature:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.feature-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.feature-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-align: center;
	}

	.feature-text strong {
		font-size: 1rem;
		color: var(--color-text);
		font-weight: 600;
	}

	.feature-text span {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.cta-button {
		display: inline-block;
		padding: 1.25rem 2.5rem;
		background: var(--color-theme-1);
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-size: 1.2rem;
		font-weight: 600;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
	}

	.cta-button:hover {
		background: var(--color-theme-2);
		text-decoration: none;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 120, 212, 0.4);
	}

	.sample-chart {
		padding: 3rem 1rem;
		background: var(--color-bg-1);
		border-top: 1px solid var(--color-border);
	}

	.sample-content {
		max-width: 900px;
		margin: 0 auto;
	}

	.sample-chart h2 {
		font-size: 2rem;
		color: var(--color-text);
		margin-bottom: 1rem;
		text-align: center;
		font-weight: 600;
	}

	.sample-description {
		font-size: 1rem;
		color: var(--color-text-muted);
		margin-bottom: 2rem;
		line-height: 1.7;
		text-align: center;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}

	.sample-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.sample-info-item {
		font-size: 0.95rem;
		color: var(--color-text);
		line-height: 1.6;
	}

	.sample-info-item strong {
		color: var(--color-theme-1);
		font-weight: 600;
		margin-right: 0.5rem;
	}

	.chart-wrapper {
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1.25rem;
		}

		.hero-description {
			font-size: 1rem;
		}

		.features {
			grid-template-columns: 1fr;
			padding: 1.5rem;
		}

		.sample-chart h2 {
			font-size: 1.5rem;
		}

		.sample-info {
			grid-template-columns: 1fr;
		}

		.chart-wrapper {
			padding: 1rem;
		}
	}
</style>
