<script lang="ts">
	import { astrologicalSymbols, getPlanetarySymbol, getZodiacSymbol, Planet } from '$lib/symbols';
	import type { House, PlanetPositions, ZodiacSign } from '$lib/zodiac';
	import { getPlanetLongitude } from '$lib/zodiac';

	interface Props {
		sunSign: ZodiacSign;
		ascendant: ZodiacSign;
		moonSign: ZodiacSign;
		houses: House[];
		planets?: PlanetPositions | null;
		utcYear?: number;
		utcMonth?: number;
		utcDay?: number;
		utcHour?: number;
		utcMinute?: number;
	}

	let { 
		sunSign, 
		ascendant, 
		moonSign, 
		houses,
		planets = null,
		utcYear = 2000,
		utcMonth = 1,
		utcDay = 1,
		utcHour = 12,
		utcMinute = 0
	}: Props = $props();

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

	// Convert ecliptic longitude to angle (0-360 degrees to radians, starting from top)
	function longitudeToAngle(longitude: number): number {
		// Normalize to 0-360
		let normalized = longitude % 360;
		if (normalized < 0) normalized += 360;
		// Convert to radians and adjust so 0° (Aries) is at top (-90° offset)
		return ((normalized - 90) * Math.PI) / 180;
	}

	// Get planet positions with their longitudes
	const planetPositions = $derived(() => {
		if (!planets) return [];
		
		const positions: Array<{ planet: Planet; symbol: string; longitude: number; sign: ZodiacSign; angle: number }> = [];
		
		// Sun
		const sunLon = getPlanetLongitude(sunSign, utcYear, utcMonth, utcDay, 'Sun', utcHour, utcMinute);
		positions.push({
			planet: Planet.Sun,
			symbol: getPlanetarySymbol(Planet.Sun),
			longitude: sunLon,
			sign: sunSign,
			angle: longitudeToAngle(sunLon)
		});
		
		// Moon
		const moonLon = getPlanetLongitude(moonSign, utcYear, utcMonth, utcDay, 'Moon', utcHour, utcMinute);
		positions.push({
			planet: Planet.Moon,
			symbol: getPlanetarySymbol(Planet.Moon),
			longitude: moonLon,
			sign: moonSign,
			angle: longitudeToAngle(moonLon)
		});
		
		// Mercury
		if (planets.mercury) {
			const mercuryLon = getPlanetLongitude(planets.mercury, utcYear, utcMonth, utcDay, 'Mercury', utcHour, utcMinute);
			positions.push({
				planet: Planet.Mercury,
				symbol: getPlanetarySymbol(Planet.Mercury),
				longitude: mercuryLon,
				sign: planets.mercury,
				angle: longitudeToAngle(mercuryLon)
			});
		}
		
		// Venus
		if (planets.venus) {
			const venusLon = getPlanetLongitude(planets.venus, utcYear, utcMonth, utcDay, 'Venus', utcHour, utcMinute);
			positions.push({
				planet: Planet.Venus,
				symbol: getPlanetarySymbol(Planet.Venus),
				longitude: venusLon,
				sign: planets.venus,
				angle: longitudeToAngle(venusLon)
			});
		}
		
		// Mars
		if (planets.mars) {
			const marsLon = getPlanetLongitude(planets.mars, utcYear, utcMonth, utcDay, 'Mars', utcHour, utcMinute);
			positions.push({
				planet: Planet.Mars,
				symbol: getPlanetarySymbol(Planet.Mars),
				longitude: marsLon,
				sign: planets.mars,
				angle: longitudeToAngle(marsLon)
			});
		}
		
		// Jupiter
		if (planets.jupiter) {
			const jupiterLon = getPlanetLongitude(planets.jupiter, utcYear, utcMonth, utcDay, 'Jupiter', utcHour, utcMinute);
			positions.push({
				planet: Planet.Jupiter,
				symbol: getPlanetarySymbol(Planet.Jupiter),
				longitude: jupiterLon,
				sign: planets.jupiter,
				angle: longitudeToAngle(jupiterLon)
			});
		}
		
		// Saturn
		if (planets.saturn) {
			const saturnLon = getPlanetLongitude(planets.saturn, utcYear, utcMonth, utcDay, 'Saturn', utcHour, utcMinute);
			positions.push({
				planet: Planet.Saturn,
				symbol: getPlanetarySymbol(Planet.Saturn),
				longitude: saturnLon,
				sign: planets.saturn,
				angle: longitudeToAngle(saturnLon)
			});
		}
		
		// Uranus
		if (planets.uranus) {
			const uranusLon = getPlanetLongitude(planets.uranus, utcYear, utcMonth, utcDay, 'Uranus', utcHour, utcMinute);
			positions.push({
				planet: Planet.Uranus,
				symbol: getPlanetarySymbol(Planet.Uranus),
				longitude: uranusLon,
				sign: planets.uranus,
				angle: longitudeToAngle(uranusLon)
			});
		}
		
		// Neptune
		if (planets.neptune) {
			const neptuneLon = getPlanetLongitude(planets.neptune, utcYear, utcMonth, utcDay, 'Neptune', utcHour, utcMinute);
			positions.push({
				planet: Planet.Neptune,
				symbol: getPlanetarySymbol(Planet.Neptune),
				longitude: neptuneLon,
				sign: planets.neptune,
				angle: longitudeToAngle(neptuneLon)
			});
		}
		
		// Pluto
		if (planets.pluto) {
			const plutoLon = getPlanetLongitude(planets.pluto, utcYear, utcMonth, utcDay, 'Pluto', utcHour, utcMinute);
			positions.push({
				planet: Planet.Pluto,
				symbol: getPlanetarySymbol(Planet.Pluto),
				longitude: plutoLon,
				sign: planets.pluto,
				angle: longitudeToAngle(plutoLon)
			});
		}
		
		return positions;
	});

	// Get planet color
	function getPlanetColor(planet: Planet): string {
		const colors: Record<Planet, string> = {
			[Planet.Sun]: '#FFD700',
			[Planet.Moon]: '#C0C0C0',
			[Planet.Mercury]: '#8C7853',
			[Planet.Venus]: '#FFC649',
			[Planet.Mars]: '#CD5C5C',
			[Planet.Jupiter]: '#D8CA9D',
			[Planet.Saturn]: '#FAD5A5',
			[Planet.Uranus]: '#4FD0E7',
			[Planet.Neptune]: '#4166F5',
			[Planet.Pluto]: '#C59808'
		};
		return colors[planet] || 'currentColor';
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
				{getZodiacSymbol(sign)}
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

		<!-- House cusp lines -->
		{#each houses as house}
			{@const cuspAngle = longitudeToAngle(house.cusp)}
			<line
				x1="300"
				y1="300"
				x2={300 + 290 * Math.cos(cuspAngle)}
				y2={300 + 290 * Math.sin(cuspAngle)}
				stroke="var(--color-theme-1)"
				stroke-width="2"
				opacity="0.4"
				class="house-cusp"
			/>
			<!-- House cusp label -->
			<text
				x={300 + 135 * Math.cos(cuspAngle)}
				y={300 + 135 * Math.sin(cuspAngle)}
				font-size="11"
				font-weight="bold"
				text-anchor="middle"
				dominant-baseline="middle"
				fill="var(--color-theme-1)"
				class="house-cusp-label"
			>
				{house.number}
			</text>
		{/each}

		<!-- Planet orbit ring -->
		<circle cx="300" cy="300" r="120" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2" stroke-dasharray="2,2" />
		
		<!-- Draw planets at their positions -->
		{#each planetPositions() as planetPos}
			{@const radius = 120}
			{@const offsetRadius = 5}
			{@const x = 300 + radius * Math.cos(planetPos.angle)}
			{@const y = 300 + radius * Math.sin(planetPos.angle)}
			{@const labelX = 300 + (radius + offsetRadius) * Math.cos(planetPos.angle)}
			{@const labelY = 300 + (radius + offsetRadius) * Math.sin(planetPos.angle)}
			{@const isPersonal = planetPos.planet === Planet.Sun || planetPos.planet === Planet.Moon || planetPos.planet === Planet.Mercury || planetPos.planet === Planet.Venus || planetPos.planet === Planet.Mars}
			
			<!-- Planet marker circle -->
			<circle
				cx={x}
				cy={y}
				r={isPersonal ? 8 : 6}
				fill={getPlanetColor(planetPos.planet)}
				stroke="var(--color-bg-1)"
				stroke-width="2"
				class="planet-marker"
				class:personal-planet={isPersonal}
				class:outer-planet={!isPersonal}
			/>
			
			<!-- Planet symbol -->
			<text
				x={x}
				y={y + 4}
				font-size={isPersonal ? "14" : "12"}
				text-anchor="middle"
				dominant-baseline="middle"
				fill="var(--color-bg-1)"
				font-weight="bold"
				class="planet-symbol"
			>
				{planetPos.symbol}
			</text>
			
			<!-- Planet label -->
			<text
				x={labelX}
				y={labelY + (isPersonal ? 20 : 18)}
				font-size="9"
				text-anchor="middle"
				dominant-baseline="middle"
				fill="var(--color-text)"
				class="planet-label"
			>
				{planetPos.planet}
			</text>
			
			<!-- Degree marker -->
			<text
				x={labelX}
				y={labelY + (isPersonal ? 32 : 30)}
				font-size="7"
				text-anchor="middle"
				dominant-baseline="middle"
				fill="var(--color-text-muted)"
				class="planet-degree"
			>
				{Math.round(planetPos.longitude % 30)}°
			</text>
		{/each}

		<!-- Central circle -->
		<circle cx="300" cy="300" r="50" fill="var(--color-bg-2)" stroke="currentColor" stroke-width="2" />
		
		<!-- Central indicators -->
		<text x="300" y="290" font-size="14" text-anchor="middle" class="indicator-label">
			{astrologicalSymbols.Ascendant}
		</text>
		<text x="300" y="310" font-size="12" text-anchor="middle" class="indicator-label">
			{ascendant}
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

	.planet-marker {
		transition: transform 0.2s ease, opacity 0.2s ease;
		cursor: pointer;
	}

	.planet-marker:hover {
		transform: scale(1.2);
		opacity: 0.9;
	}

	.planet-marker.personal-planet {
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}

	.planet-symbol {
		pointer-events: none;
		user-select: none;
	}

	.planet-label {
		fill: var(--color-text);
		font-weight: 500;
		pointer-events: none;
		user-select: none;
	}

	.planet-degree {
		pointer-events: none;
		user-select: none;
		opacity: 0.7;
	}

	.house-cusp {
		pointer-events: none;
	}

	.house-cusp-label {
		pointer-events: none;
		user-select: none;
	}
</style>
