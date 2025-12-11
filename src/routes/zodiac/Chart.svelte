<script lang="ts">
	import type { House, ZodiacSign } from '$lib/zodiac';

	interface Props {
		sunSign: ZodiacSign;
		ascendant: ZodiacSign;
		moonSign: ZodiacSign;
		houses: House[];
	}

	let { sunSign, ascendant, moonSign, houses }: Props = $props();

	const zodiacSigns: ZodiacSign[] = [
		'Aries',
		'Taurus',
		'Gemini',
		'Cancer',
		'Leo',
		'Virgo',
		'Libra',
		'Scorpio',
		'Sagittarius',
		'Capricorn',
		'Aquarius',
		'Pisces'
	];

	const zodiacSymbols: Record<ZodiacSign, string> = {
		Aries: '♈',
		Taurus: '♉',
		Gemini: '♊',
		Cancer: '♋',
		Leo: '♌',
		Virgo: '♍',
		Libra: '♎',
		Scorpio: '♏',
		Sagittarius: '♐',
		Capricorn: '♑',
		Aquarius: '♒',
		Pisces: '♓'
	};

	// Calculate the angle for each sign (starting from Aries at 0°)
	function getSignAngle(sign: ZodiacSign): number {
		const index = zodiacSigns.indexOf(sign);
		return (index * 30 - 90) * (Math.PI / 180); // -90 to start at top
	}

	// Get house number for a given sign
	function getHouseForSign(sign: ZodiacSign): number {
		const house = houses.find((h) => h.sign === sign);
		return house ? house.number : 0;
	}
</script>

<div class="chart-container">
	<svg viewBox="0 0 600 600" class="chart-svg">
		<!-- Outer circle -->
		<circle cx="300" cy="300" r="290" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3" />

		<!-- Draw 12 sectors for zodiac signs -->
		{#each zodiacSigns as sign, index}
			{@const angle = (index * 30 - 90) * (Math.PI / 180)}
			{@const nextAngle = ((index + 1) * 30 - 90) * (Math.PI / 180)}
			{@const houseNum = getHouseForSign(sign)}
			{@const isAscendant = sign === ascendant}
			{@const isSun = sign === sunSign}
			{@const isMoon = sign === moonSign}

			<!-- Sector background -->
			<path
				d="M 300 300 L {300 + 280 * Math.cos(angle)} {300 + 280 * Math.sin(angle)} A 280 280 0 0 1 {300 + 280 * Math.cos(nextAngle)} {300 + 280 * Math.sin(nextAngle)} Z"
				fill={isAscendant ? 'rgba(0, 120, 212, 0.1)' : 'transparent'}
				stroke="currentColor"
				stroke-width="1"
				opacity="0.2"
				class="sector"
			/>

			<!-- Zodiac symbol -->
			<text
				x={300 + 200 * Math.cos(angle + (Math.PI / 12))}
				y={300 + 200 * Math.sin(angle + (Math.PI / 12))}
				font-size="32"
				text-anchor="middle"
				dominant-baseline="middle"
				class="zodiac-symbol"
				class:highlight={isSun || isMoon || isAscendant}
			>
				{zodiacSymbols[sign]}
			</text>

			<!-- Sign name -->
			<text
				x={300 + 240 * Math.cos(angle + (Math.PI / 12))}
				y={300 + 240 * Math.sin(angle + (Math.PI / 12))}
				font-size="12"
				text-anchor="middle"
				dominant-baseline="middle"
				class="sign-name"
			>
				{sign}
			</text>

			<!-- House number -->
			{#if houseNum > 0}
				<text
					x={300 + 150 * Math.cos(angle + (Math.PI / 12))}
					y={300 + 150 * Math.sin(angle + (Math.PI / 12))}
					font-size="14"
					font-weight="bold"
					text-anchor="middle"
					dominant-baseline="middle"
					class="house-number"
				>
					{houseNum}
				</text>
			{/if}

			<!-- Radial lines dividing sectors -->
			<line
				x1="300"
				y1="300"
				x2={300 + 290 * Math.cos(angle)}
				y2={300 + 290 * Math.sin(angle)}
				stroke="currentColor"
				stroke-width="1"
				opacity="0.2"
			/>
		{/each}

		<!-- Central circle with sunburst -->
		<circle cx="300" cy="300" r="80" fill="var(--color-bg-2)" stroke="currentColor" stroke-width="2" />
		
		<!-- Sunburst rays -->
		{#each Array(24) as _, i}
			{@const rayAngle = (i * 15 - 90) * (Math.PI / 180)}
			<line
				x1={300 + 70 * Math.cos(rayAngle)}
				y1={300 + 70 * Math.sin(rayAngle)}
				x2={300 + 85 * Math.cos(rayAngle)}
				y2={300 + 85 * Math.sin(rayAngle)}
				stroke="currentColor"
				stroke-width="1.5"
				opacity="0.4"
			/>
		{/each}

		<!-- Central indicators -->
		<text x="300" y="280" font-size="16" text-anchor="middle" class="indicator-label">
			☉ {sunSign}
		</text>
		<text x="300" y="300" font-size="14" text-anchor="middle" class="indicator-label">
			☽ {moonSign}
		</text>
		<text x="300" y="320" font-size="14" text-anchor="middle" class="indicator-label">
			ASC {ascendant}
		</text>
	</svg>
</div>

<style>
	.chart-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		margin-top: 2rem;
	}

	.chart-svg {
		width: 100%;
		max-width: 600px;
		height: auto;
		color: var(--color-text);
	}

	.sector {
		transition: fill 0.3s ease;
	}

	.zodiac-symbol {
		fill: currentColor;
		transition: transform 0.2s ease, opacity 0.2s ease;
	}

	.zodiac-symbol.highlight {
		opacity: 1;
		transform: scale(1.2);
		fill: var(--color-theme-1);
	}

	.sign-name {
		fill: var(--color-text-muted);
		font-weight: 500;
	}

	.house-number {
		fill: var(--color-theme-1);
	}

	.indicator-label {
		fill: var(--color-text);
		font-weight: 500;
	}
</style>
