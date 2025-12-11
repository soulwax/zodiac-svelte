<script lang="ts">
	import { getTimezoneFromCoords, searchPlaces, type Place } from '$lib/geocoding';
	import {
		calculateAscendant,
		calculateHouses,
		calculateMoonSign,
		calculateSunSign,
		type House,
		type ZodiacSign
	} from '$lib/zodiac';
	import generalData from '../../data/general.json';
	import Chart from './Chart.svelte';

	// Helper function to convert ZodiacSign to lowercase key
	function getSignKey(sign: ZodiacSign | null): string {
		if (!sign) return '';
		return sign.toLowerCase();
	}

	// Get full sign data
	function getSignData(sign: ZodiacSign | null) {
		if (!sign) return null;
		const signKey = getSignKey(sign);
		return generalData.zodiac_signs[signKey as keyof typeof generalData.zodiac_signs] || null;
	}

	// Get description for a sign in a specific placement (sun, moon, ascendant)
	function getSignDescription(sign: ZodiacSign | null, placement: 'sun' | 'moon' | 'ascendant'): string {
		if (!sign) return '';
		const signData = getSignData(sign);
		if (!signData || !signData[placement]) return '';
		return signData[placement].description;
	}

	// Get keywords for a sign in a specific placement
	function getSignKeywords(sign: ZodiacSign | null, placement: 'sun' | 'moon' | 'ascendant'): string[] {
		if (!sign) return [];
		const signData = getSignData(sign);
		if (!signData || !signData[placement]) return [];
		return signData[placement].keywords || [];
	}

	// Get core point description
	function getCorePointDescription(point: 'sun' | 'moon' | 'ascendant'): string {
		return generalData.info.core_points[point]?.description || '';
	}

	// Get core point role
	function getCorePointRole(point: 'sun' | 'moon' | 'ascendant'): string {
		return generalData.info.core_points[point]?.role || '';
	}

	// Get core point keywords
	function getCorePointKeywords(point: 'sun' | 'moon' | 'ascendant'): string[] {
		return generalData.info.core_points[point]?.keywords || [];
	}

	// Get house information
	function getHouseInfo(houseNumber: number) {
		const houseKey = String(houseNumber);
		return generalData.info.houses[houseKey as keyof typeof generalData.info.houses];
	}

	let birthDate = $state('');
	let birthTime = $state('');
	let placeQuery = $state('');
	let selectedPlace = $state<Place | null>(null);
	let suggestions = $state<Place[]>([]);
	let showSuggestions = $state(false);
	let sunSign = $state<ZodiacSign | null>(null);
	let ascendant = $state<ZodiacSign | null>(null);
	let moonSign = $state<ZodiacSign | null>(null);
	let houses = $state<House[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Computed sign data for type safety
	const sunSignData = $derived(sunSign ? getSignData(sunSign) : null);
	const moonSignData = $derived(moonSign ? getSignData(moonSign) : null);
	const ascendantSignData = $derived(ascendant ? getSignData(ascendant) : null);

	async function handlePlaceInput(value: string) {
		placeQuery = value;
		selectedPlace = null;
		sunSign = null;
		ascendant = null;
		moonSign = null;
		houses = [];

		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		if (value.length < 3) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		debounceTimer = setTimeout(async () => {
			const results = await searchPlaces(value);
			suggestions = results;
			showSuggestions = true;
		}, 300);
	}

	function selectPlace(place: Place) {
		selectedPlace = place;
		placeQuery = place.display_name;
		showSuggestions = false;
		suggestions = [];
	}

	async function calculateSign() {
		error = null;
		sunSign = null;
		ascendant = null;
		moonSign = null;
		houses = [];

		if (!birthDate || !birthTime || !selectedPlace) {
			error = 'Please fill in all fields and select a place from the suggestions.';
			return;
		}

		isLoading = true;

		try {
			// Parse the birth date and time
			const [year, month, day] = birthDate.split('-').map(Number);
			const [hours, minutes] = birthTime.split(':').map(Number);

			if (!year || !month || !day || hours === undefined || minutes === undefined) {
				throw new Error('Invalid date or time format');
			}

			// Get timezone for the selected place
			const lat = parseFloat(selectedPlace.lat);
			const lon = parseFloat(selectedPlace.lon);

			let timezone: string | null = null;
			try {
				timezone = await getTimezoneFromCoords(lat, lon);
			} catch (err) {
				console.warn('Could not fetch timezone, using local timezone');
			}

			// Interpret the user's input as local time in the birth place's timezone
			// For sun sign calculation, we need the date (month/day) in that timezone
			let signMonth: number = month;
			let signDay: number = day;
			let utcYear: number = year;
			let utcMonth: number = month;
			let utcDay: number = day;
			let utcHour: number = hours;
			let utcMinute: number = minutes;

			if (timezone) {
				// The user entered a date/time as local time in the birth place's timezone.
				// We need to find the UTC timestamp that corresponds to that local time.
				// This handles DST correctly since the timezone string includes DST rules.
				
				// Create a formatter for the target timezone
				const formatter = new Intl.DateTimeFormat('en-CA', {
					timeZone: timezone,
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				});

				// We'll use an iterative approach to find the correct UTC time
				// Start with an approximate UTC time (using the date as if it were UTC)
				const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
				let testDate = new Date(dateStr + 'Z');
				
				// Adjust for timezone offset (most timezones are within ±14 hours of UTC)
				// We'll iterate to find the exact match
				for (let i = 0; i < 20; i++) {
					const parts = formatter.formatToParts(testDate);
					const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
					const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
					const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
					const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
					const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

					// Check if we've found a match (allow 1 hour tolerance for convergence)
					if (tzYear === year && tzMonth === month && tzDay === day) {
						const hourDiff = Math.abs(tzHour - hours);
						const minuteDiff = Math.abs(tzMinute - minutes);
						
						if (hourDiff === 0 && minuteDiff <= 1) {
							// Perfect match - use this date
							signMonth = tzMonth;
							signDay = tzDay;
							// Extract UTC components
							utcYear = testDate.getUTCFullYear();
							utcMonth = testDate.getUTCMonth() + 1;
							utcDay = testDate.getUTCDate();
							utcHour = testDate.getUTCHours();
							utcMinute = testDate.getUTCMinutes();
							break;
						}
						
						// Adjust based on time difference
						const totalDiffMinutes = (hours - tzHour) * 60 + (minutes - tzMinute);
						testDate = new Date(testDate.getTime() + totalDiffMinutes * 60 * 1000);
					} else {
						// Date doesn't match - adjust by a day
						const dayDiff = (year - tzYear) * 365 + (month - tzMonth) * 30 + (day - tzDay);
						testDate = new Date(testDate.getTime() + dayDiff * 24 * 60 * 60 * 1000);
					}
					
					// Safety check - use the date components from the timezone
					if (i === 19) {
						const finalParts = formatter.formatToParts(testDate);
						signMonth = parseInt(finalParts.find(p => p.type === 'month')?.value || String(month));
						signDay = parseInt(finalParts.find(p => p.type === 'day')?.value || String(day));
						utcYear = testDate.getUTCFullYear();
						utcMonth = testDate.getUTCMonth() + 1;
						utcDay = testDate.getUTCDate();
						utcHour = testDate.getUTCHours();
						utcMinute = testDate.getUTCMinutes();
					}
				}
			} else {
				// Fallback: use the date as-is (assuming user entered local time)
				signMonth = month;
				signDay = day;
				// For houses, we'll use the local time as UTC (not ideal, but better than nothing)
				utcYear = year;
				utcMonth = month;
				utcDay = day;
				utcHour = hours;
				utcMinute = minutes;
			}

			sunSign = calculateSunSign(signMonth, signDay);
			
			// Calculate ascendant and moon sign using UTC time and location coordinates
			ascendant = calculateAscendant(utcYear, utcMonth, utcDay, utcHour, utcMinute, lat, lon);
			moonSign = calculateMoonSign(utcYear, utcMonth, utcDay, utcHour, utcMinute);
			
			// Calculate houses using UTC time and location coordinates
			houses = calculateHouses(utcYear, utcMonth, utcDay, utcHour, utcMinute, lat, lon);

			// Save results to database
			try {
				const formData = new FormData();
				formData.append('birthDate', birthDate);
				formData.append('birthTime', birthTime);
				formData.append('placeName', selectedPlace.display_name);
				formData.append('latitude', selectedPlace.lat);
				formData.append('longitude', selectedPlace.lon);
				if (timezone) formData.append('timezone', timezone);
				formData.append('sunSign', sunSign);
				formData.append('ascendant', ascendant);
				formData.append('moonSign', moonSign);
				formData.append('houses', JSON.stringify(houses));
				formData.append('utcYear', String(utcYear));
				formData.append('utcMonth', String(utcMonth));
				formData.append('utcDay', String(utcDay));
				formData.append('utcHour', String(utcHour));
				formData.append('utcMinute', String(utcMinute));

				const response = await fetch('?/save', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					console.warn('Failed to save zodiac result to database');
				}
			} catch (saveError) {
				// Don't fail the calculation if saving fails
				console.warn('Error saving zodiac result:', saveError);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred while calculating your sun sign.';
			console.error('Calculation error:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.autocomplete-container')) {
			showSuggestions = false;
		}
	}

	$effect(() => {
		if (typeof window !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<svelte:head>
	<title>Zodiac Calculator</title>
	<meta name="description" content="Calculate your zodiac sun sign based on your birth date, time, and location" />
</svelte:head>

<div class="container">
	<div class="card">
		<h1>Zodiac Calculator</h1>
		<p class="subtitle">Enter your birth details to discover your sun sign and astrological houses</p>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				calculateSign();
			}}
			class="form"
		>
			<div class="form-group">
				<label for="birthdate">Birth Date</label>
				<input
					type="date"
					id="birthdate"
					bind:value={birthDate}
					required
					class="input"
				/>
			</div>

			<div class="form-group">
				<label for="birthtime">Birth Time</label>
				<input
					type="time"
					id="birthtime"
					bind:value={birthTime}
					required
					class="input"
				/>
			</div>

			<div class="form-group autocomplete-container">
				<label for="place">Birth Place</label>
				<input
					type="text"
					id="place"
					placeholder="Start typing a city or place..."
					bind:value={placeQuery}
					oninput={(e) => handlePlaceInput((e.target as HTMLInputElement).value)}
					required
					class="input"
					autocomplete="off"
				/>
				{#if showSuggestions && suggestions.length > 0}
					<ul class="suggestions">
						{#each suggestions as suggestion}
							<li
								onclick={() => selectPlace(suggestion)}
								class="suggestion-item"
							>
								{suggestion.display_name}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<button type="submit" disabled={isLoading} class="button">
				{isLoading ? 'Calculating...' : 'Calculate Chart'}
			</button>
		</form>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		{#if sunSign && ascendant && moonSign}
			<div class="result">
				<h2>Your Core Astrological Signs</h2>
				<div class="signs-list">
					<!-- Sun Sign -->
					{#if sunSignData}
						<div class="sign-item">
							<div class="sign-header">
								<div class="sign-label">Sun Sign</div>
								<div class="sign-name">{sunSign}</div>
								<div class="sign-metadata">
									<span class="badge badge-{sunSignData.element}">{sunSignData.element}</span>
									<span class="badge badge-modality">{sunSignData.modality}</span>
									<span class="badge badge-ruler">Ruled by {sunSignData.ruler}</span>
								</div>
							</div>
						<div class="sign-content">
							<div class="core-point-info">
								<div class="core-point-role">{getCorePointRole('sun')}</div>
								<div class="core-point-description">{getCorePointDescription('sun')}</div>
								{#if getCorePointKeywords('sun').length > 0}
									<div class="keywords">
										<span class="keywords-label">Keywords:</span>
										{#each getCorePointKeywords('sun') as keyword}
											<span class="keyword">{keyword}</span>
										{/each}
									</div>
								{/if}
							</div>
							<div class="placement-info">
								<div class="placement-title">Sun in {sunSign}</div>
								<div class="placement-description">
									{getSignDescription(sunSign, 'sun')}
								</div>
								{#if getSignKeywords(sunSign, 'sun').length > 0}
									<div class="keywords">
										<span class="keywords-label">Keywords:</span>
										{#each getSignKeywords(sunSign, 'sun') as keyword}
											<span class="keyword">{keyword}</span>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
					{/if}

					<!-- Moon Sign -->
					{#if moonSignData}
						<div class="sign-item">
							<div class="sign-header">
								<div class="sign-label">Moon Sign</div>
								<div class="sign-name">{moonSign}</div>
								<div class="sign-metadata">
									<span class="badge badge-{moonSignData.element}">{moonSignData.element}</span>
									<span class="badge badge-modality">{moonSignData.modality}</span>
									<span class="badge badge-ruler">Ruled by {moonSignData.ruler}</span>
								</div>
							</div>
						<div class="sign-content">
							<div class="core-point-info">
								<div class="core-point-role">{getCorePointRole('moon')}</div>
								<div class="core-point-description">{getCorePointDescription('moon')}</div>
								{#if getCorePointKeywords('moon').length > 0}
									<div class="keywords">
										<span class="keywords-label">Keywords:</span>
										{#each getCorePointKeywords('moon') as keyword}
											<span class="keyword">{keyword}</span>
										{/each}
									</div>
								{/if}
							</div>
							<div class="placement-info">
								<div class="placement-title">Moon in {moonSign}</div>
								<div class="placement-description">
									{getSignDescription(moonSign, 'moon')}
								</div>
								{#if getSignKeywords(moonSign, 'moon').length > 0}
									<div class="keywords">
										<span class="keywords-label">Keywords:</span>
										{#each getSignKeywords(moonSign, 'moon') as keyword}
											<span class="keyword">{keyword}</span>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
					{/if}

					<!-- Ascendant Sign -->
					{#if ascendantSignData}
						<div class="sign-item">
							<div class="sign-header">
								<div class="sign-label">Ascendant (Rising Sign)</div>
								<div class="sign-name">{ascendant}</div>
								<div class="sign-metadata">
									<span class="badge badge-{ascendantSignData.element}">{ascendantSignData.element}</span>
									<span class="badge badge-modality">{ascendantSignData.modality}</span>
									<span class="badge badge-ruler">Ruled by {ascendantSignData.ruler}</span>
								</div>
							</div>
						<div class="sign-content">
							<div class="core-point-info">
								<div class="core-point-role">{getCorePointRole('ascendant')}</div>
								<div class="core-point-description">{getCorePointDescription('ascendant')}</div>
								{#if getCorePointKeywords('ascendant').length > 0}
									<div class="keywords">
										<span class="keywords-label">Keywords:</span>
										{#each getCorePointKeywords('ascendant') as keyword}
											<span class="keyword">{keyword}</span>
										{/each}
									</div>
								{/if}
							</div>
							<div class="placement-info">
								<div class="placement-title">{ascendant} Rising</div>
								<div class="placement-description">
									{getSignDescription(ascendant, 'ascendant')}
								</div>
								{#if getSignKeywords(ascendant, 'ascendant').length > 0}
									<div class="keywords">
										<span class="keywords-label">Keywords:</span>
										{#each getSignKeywords(ascendant, 'ascendant') as keyword}
											<span class="keyword">{keyword}</span>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if sunSign && ascendant && moonSign && houses.length > 0}
			<Chart {sunSign} {ascendant} {moonSign} {houses} />
		{/if}

		{#if houses.length > 0}
			<div class="houses-result">
				<h2>Your Astrological Houses</h2>
				<div class="houses-grid">
					{#each houses as house}
						{@const houseInfo = getHouseInfo(house.number)}
						<div class="house-item">
							<div class="house-header">
								<div class="house-number">House {house.number}</div>
								<div class="house-sign">{house.sign}</div>
							</div>
							<div class="house-alias">{houseInfo?.alias || ''}</div>
							{#if houseInfo}
								<div class="house-description">{houseInfo.description}</div>
								{#if houseInfo.keywords && houseInfo.keywords.length > 0}
									<div class="keywords">
										<span class="keywords-label">Keywords:</span>
										{#each houseInfo.keywords as keyword}
											<span class="keyword">{keyword}</span>
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: calc(100vh - 200px);
		padding: 2rem 1rem;
	}

	.card {
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2.5rem;
		max-width: 800px;
		width: 100%;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
		text-align: center;
	}

	.subtitle {
		text-align: center;
		color: var(--color-text-muted);
		margin: 0 0 2rem 0;
		font-size: 0.95rem;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: relative;
	}

	label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.input {
		padding: 0.75rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		color: var(--color-text);
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-theme-1);
		box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2);
	}

	.input::placeholder {
		color: var(--color-text-muted);
	}

	.autocomplete-container {
		position: relative;
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-top: none;
		border-radius: 0 0 4px 4px;
		margin: 0;
		padding: 0;
		list-style: none;
		max-height: 200px;
		overflow-y: auto;
		z-index: 10;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.suggestion-item {
		padding: 0.75rem;
		cursor: pointer;
		color: var(--color-text);
		border-bottom: 1px solid var(--color-border);
		transition: background-color 0.15s;
	}

	.suggestion-item:last-child {
		border-bottom: none;
	}

	.suggestion-item:hover {
		background: var(--color-bg-3);
	}

	.button {
		padding: 0.875rem 1.5rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		font-family: inherit;
	}

	.button:hover:not(:disabled) {
		background: var(--color-theme-2);
	}

	.button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		margin-top: 1.5rem;
		padding: 1rem;
		background: rgba(196, 43, 28, 0.15);
		border: 1px solid rgba(196, 43, 28, 0.5);
		border-radius: 4px;
		color: #ff6b6b;
		font-size: 0.9rem;
	}

	.result {
		margin-top: 2rem;
		padding: 2rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.result h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
		color: var(--color-text);
		text-align: center;
	}

	.signs-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.sign-item {
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.sign-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.sign-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--color-border);
	}

	.sign-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.sign-name {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-theme-1);
		margin-bottom: 1rem;
	}

	.sign-metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.badge {
		padding: 0.35rem 0.75rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
		text-transform: capitalize;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.badge-fire {
		background: rgba(255, 87, 34, 0.15);
		border-color: rgba(255, 87, 34, 0.4);
		color: #ff6b35;
	}

	.badge-earth {
		background: rgba(139, 195, 74, 0.15);
		border-color: rgba(139, 195, 74, 0.4);
		color: #8bc34a;
	}

	.badge-air {
		background: rgba(33, 150, 243, 0.15);
		border-color: rgba(33, 150, 243, 0.4);
		color: #2196f3;
	}

	.badge-water {
		background: rgba(63, 81, 181, 0.15);
		border-color: rgba(63, 81, 181, 0.4);
		color: #3f51b5;
	}

	.badge-modality {
		background: rgba(156, 39, 176, 0.15);
		border-color: rgba(156, 39, 176, 0.4);
		color: #9c27b0;
	}

	.badge-ruler {
		background: rgba(255, 152, 0, 0.15);
		border-color: rgba(255, 152, 0, 0.4);
		color: #ff9800;
	}

	.sign-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.core-point-info {
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1.25rem;
	}

	.core-point-role {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-theme-1);
		margin-bottom: 0.75rem;
	}

	.core-point-description {
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	.placement-info {
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1.25rem;
	}

	.placement-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	.placement-description {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	.keywords {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
	}

	.keywords-label {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.keyword {
		padding: 0.25rem 0.6rem;
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		font-size: 0.8rem;
		color: var(--color-text);
	}

	.houses-result {
		margin-top: 2rem;
		padding: 2rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.houses-result h2 {
		font-size: 1.25rem;
		font-weight: 500;
		margin: 0 0 1.5rem 0;
		color: var(--color-text-muted);
		text-align: center;
	}

	.houses-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.house-item {
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1.5rem;
		text-align: left;
		transition: transform 0.2s, box-shadow 0.2s;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.house-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.house-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.house-number {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.house-alias {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.house-sign {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-theme-1);
		padding: 0.25rem 0.6rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}

	.house-description {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	@media (max-width: 640px) {
		.card {
			padding: 1.5rem;
		}

		h1 {
			font-size: 1.75rem;
		}

		.houses-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>

