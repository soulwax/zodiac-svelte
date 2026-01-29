<!-- File: src/routes/zodiac/Chart.svelte -->

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
			[Planet.Moon]: '#E8E8E8',
			[Planet.Mercury]: '#A0826D',
			[Planet.Venus]: '#FF69B4',
			[Planet.Mars]: '#DC143C',
			[Planet.Jupiter]: '#FF8C00',
			[Planet.Saturn]: '#4169E1',
			[Planet.Uranus]: '#00CED1',
			[Planet.Neptune]: '#9370DB',
			[Planet.Pluto]: '#8B4513'
		};
		return colors[planet] || 'currentColor';
	}

	// Calculate aspects between planets
	type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

	interface Aspect {
		planet1: number; // index in planetPositions array
		planet2: number;
		type: AspectType;
		angle: number;
		orb: number; // how many degrees off from exact
	}

	const aspects = $derived(() => {
		const positions = planetPositions();
		const foundAspects: Aspect[] = [];

		// Aspect definitions: angle and allowed orb
		const aspectDefs: Record<AspectType, { angle: number; orb: number }> = {
			conjunction: { angle: 0, orb: 10 },
			opposition: { angle: 180, orb: 10 },
			trine: { angle: 120, orb: 8 },
			square: { angle: 90, orb: 8 },
			sextile: { angle: 60, orb: 6 }
		};

		// Check all planet pairs
		for (let i = 0; i < positions.length; i++) {
			for (let j = i + 1; j < positions.length; j++) {
				const long1 = positions[i].longitude;
				const long2 = positions[j].longitude;

				// Calculate the angle between the two planets
				let diff = Math.abs(long1 - long2);
				if (diff > 180) diff = 360 - diff;

				// Check each aspect type
				for (const [aspectType, def] of Object.entries(aspectDefs)) {
					const deviation = Math.abs(diff - def.angle);
					if (deviation <= def.orb) {
						foundAspects.push({
							planet1: i,
							planet2: j,
							type: aspectType as AspectType,
							angle: diff,
							orb: deviation
						});
					}
				}
			}
		}

		return foundAspects;
	});

	// Get aspect color and style
	function getAspectStyle(aspect: AspectType): { color: string; dashArray: string; width: number; opacity: number } {
		const styles: Record<AspectType, { color: string; dashArray: string; width: number; opacity: number }> = {
			conjunction: { color: '#FFD700', dashArray: '0', width: 2, opacity: 0.8 },
			opposition: { color: '#DC143C', dashArray: '5,5', width: 1.5, opacity: 0.6 },
			trine: { color: '#00C853', dashArray: '0', width: 1.5, opacity: 0.5 },
			square: { color: '#FF6B6B', dashArray: '3,3', width: 1.5, opacity: 0.5 },
			sextile: { color: '#4FC3F7', dashArray: '2,2', width: 1, opacity: 0.4 }
		};
		return styles[aspect];
	}
</script>

<div class="chart-container">
	<svg viewBox="0 0 600 600" class="chart-svg">
		<!-- Outer circle -->
		<circle cx="300" cy="300" r="290" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3" />

		<!-- Draw 12 sectors for zodiac signs -->
		{#each zodiacSigns as sign, index (sign)}
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

		<!-- Aspect lines between planets -->
		{#each aspects() as aspect (`${aspect.planet1}-${aspect.planet2}-${aspect.type}`)}
			{@const positions = planetPositions()}
			{@const pos1 = positions[aspect.planet1]}
			{@const pos2 = positions[aspect.planet2]}
			{@const radius = 120}
			{@const x1 = 300 + radius * Math.cos(pos1.angle)}
			{@const y1 = 300 + radius * Math.sin(pos1.angle)}
			{@const x2 = 300 + radius * Math.cos(pos2.angle)}
			{@const y2 = 300 + radius * Math.sin(pos2.angle)}
			{@const style = getAspectStyle(aspect.type)}

			<line
				x1={x1}
				y1={y1}
				x2={x2}
				y2={y2}
				stroke={style.color}
				stroke-width={style.width}
				stroke-dasharray={style.dashArray}
				opacity={style.opacity}
				class="aspect-line aspect-{aspect.type}"
			/>
		{/each}

		<!-- Planet orbit ring -->
		<circle cx="300" cy="300" r="120" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3" />

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

		<!-- Aspect Legend -->
		<g class="aspect-legend">
			<text x="50" y="560" font-size="10" font-weight="bold" fill="currentColor">Aspects:</text>

			<!-- Conjunction -->
			<line x1="100" y1="556" x2="130" y2="556" stroke="#FFD700" stroke-width="2" opacity="0.8" />
			<text x="135" y="560" font-size="8" fill="currentColor">Conjunction</text>

			<!-- Opposition -->
			<line x1="210" y1="556" x2="240" y2="556" stroke="#DC143C" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.6" />
			<text x="245" y="560" font-size="8" fill="currentColor">Opposition</text>

			<!-- Trine -->
			<line x1="320" y1="556" x2="350" y2="556" stroke="#00C853" stroke-width="1.5" opacity="0.5" />
			<text x="355" y="560" font-size="8" fill="currentColor">Trine</text>

			<!-- Square -->
			<line x1="405" y1="556" x2="435" y2="556" stroke="#FF6B6B" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />
			<text x="440" y="560" font-size="8" fill="currentColor">Square</text>

			<!-- Sextile -->
			<line x1="490" y1="556" x2="520" y2="556" stroke="#4FC3F7" stroke-width="1" stroke-dasharray="2,2" opacity="0.4" />
			<text x="525" y="560" font-size="8" fill="currentColor">Sextile</text>
		</g>
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

	.aspect-line {
		pointer-events: none;
		transition: opacity 0.3s ease, stroke-width 0.3s ease;
	}

	.aspect-line:hover {
		opacity: 1 !important;
		stroke-width: 3;
	}

	.aspect-conjunction {
		filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.5));
	}

	.aspect-trine {
		filter: drop-shadow(0 0 2px rgba(0, 200, 83, 0.3));
	}

	.aspect-legend {
		opacity: 0.9;
	}

	.aspect-legend text {
		font-size: 8px;
		fill: var(--color-text);
	}

	.planet-marker.outer-planet {
		opacity: 0.85;
	}
</style>
