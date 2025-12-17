<script lang="ts">
	import { getTimezoneFromCoords, searchPlaces, type Place } from '$lib/geocoding';
	import {
		calculateAllPlanets,
		calculateAscendant,
		calculateHouses,
		calculateMoonSign,
		calculateSunSign,
		getPlanetHouse,
		getPlanetLongitude,
		type House,
		type PlanetPositions,
		type ZodiacSign
	} from '$lib/zodiac';
	import generalData from '../../data/general.json';
	import planetsData from '../../data/planets.json';
	import type { PageData } from './$types';
	import Chart from './Chart.svelte';
	import { jsPDF } from 'jspdf';

	let { data }: { data: PageData } = $props();

	// Type definitions for planet data structures
	type PlanetSignData = {
		keywords: string[];
		description: string;
	};

	// type PlanetWithEntries = {
	// 	generic_formula: string;
	// 	entries: Record<string, string>;
	// };

	// type PlanetDataRecord = Record<string, PlanetSignData>;

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

	// Format time in 12-hour format with AM/PM
	function formatTime12Hour(hours: number, minutes: number): string {
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		const displayMinutes = String(minutes).padStart(2, '0');
		return `${displayHours}:${displayMinutes} ${period}`;
	}

	// Get house information
	function getHouseInfo(houseNumber: number) {
		const houseKey = String(houseNumber);
		return generalData.info.houses[houseKey as keyof typeof generalData.info.houses];
	}

	let fullName = $state('');
	let lifeTrajectory = $state<'down' | 'slightly down' | 'neutral' | 'slightly up' | 'up' | ''>('');
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
	let planets = $state<PlanetPositions | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let normalizedTime = $state<string | null>(null);
	let isDST = $state<boolean | null>(null);
	let timezoneName = $state<string | null>(null);
	let utcYear = $state<number>(0);
	let utcMonth = $state<number>(0);
	let utcDay = $state<number>(0);
	let utcHour = $state<number>(0);
	let utcMinute = $state<number>(0);
	let isGeneratingPDF = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	
	// AI Analysis state
	let aiAnalysis = $state<string | null>(null);
	let isGeneratingAnalysis = $state(false);
	let analysisError = $state<string | null>(null);

	// Computed sign data for type safety
	const sunSignData = $derived(sunSign ? getSignData(sunSign) : null);
	const moonSignData = $derived(moonSign ? getSignData(moonSign) : null);
	const ascendantSignData = $derived(ascendant ? getSignData(ascendant) : null);

	// Get planet description from planets.json
	function getPlanetDescription(planet: string, sign: ZodiacSign | null): { keywords: string[]; description: string } | null {
		if (!sign) return null;
		const signKey = getSignKey(sign);
		const planetData = planetsData.planetary_sign_details[planet as keyof typeof planetsData.planetary_sign_details];
		if (!planetData || typeof planetData !== 'object') return null;
		
		// Handle different planet structures
		if ('entries' in planetData) {
			// Jupiter/Saturn format
			const entry = planetData.entries[signKey as keyof typeof planetData.entries];
			if (entry) {
				return {
					keywords: [],
					description: `${planetData.generic_formula.replace('[Sign Quality]', entry)}`
				};
			}
		} else {
			// Mercury/Venus/Mars format
			const signData = planetData[signKey as keyof typeof planetData];
			if (
				signData &&
				typeof signData === 'object' &&
				signData !== null &&
				'description' in signData
			) {
				const typedSignData = signData as PlanetSignData;
				return {
					keywords: typedSignData.keywords || [],
					description: typedSignData.description
				};
			}
		}
		return null;
	}

	// Get house placement description
	function getHousePlacementDescription(planet: 'sun' | 'moon' | 'saturn', houseNumber: number): string {
		const houseKey = String(houseNumber);
		const placementKey = `${planet}_in_house` as keyof typeof planetsData.house_placement_descriptions;
		const placementData = planetsData.house_placement_descriptions[placementKey];
		if (placementData && typeof placementData === 'object') {
			return (placementData as Record<string, string>)[houseKey] || '';
		}
		return '';
	}

	async function handlePlaceInput(value: string) {
		placeQuery = value;
		selectedPlace = null;
		sunSign = null;
		ascendant = null;
		moonSign = null;
		houses = [];
		planets = null;

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
		planets = null;
		aiAnalysis = null;
		analysisError = null;

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
			} catch (err: unknown) {
				console.warn(`Failed to get timezone for coordinates (${lat}, ${lon}):`, err);
			}

			// Interpret the user's input as local time in the birth place's timezone
			// For sun sign calculation, we use the date (month/day) that the user entered,
			// which is already in the birth location's timezone
			// The timezone conversion only affects the UTC time for ascendant, moon sign, houses, etc.
			const signMonth: number = month;
			const signDay: number = day;
			utcYear = year;
			utcMonth = month;
			utcDay = day;
			utcHour = hours;
			utcMinute = minutes;

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
							// Perfect match - extract UTC components
							// Note: signMonth and signDay remain as the user entered them
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
					
					// Safety check - extract UTC components
					// Note: signMonth and signDay remain as the user entered them
					if (i === 19) {
						utcYear = testDate.getUTCFullYear();
						utcMonth = testDate.getUTCMonth() + 1;
						utcDay = testDate.getUTCDate();
						utcHour = testDate.getUTCHours();
						utcMinute = testDate.getUTCMinutes();
					}
				}
			} else {
				// Fallback: use the date as-is (assuming user entered local time)
				// Note: signMonth and signDay are already set to the user's input
				// For houses, we'll use the local time as UTC (not ideal, but better than nothing)
				utcYear = year;
				utcMonth = month;
				utcDay = day;
				utcHour = hours;
				utcMinute = minutes;
			}

			sunSign = calculateSunSign(signMonth, signDay, utcYear);
			
			// Calculate ascendant and moon sign using UTC time and location coordinates
			ascendant = calculateAscendant(utcYear, utcMonth, utcDay, utcHour, utcMinute, lat, lon);
			moonSign = calculateMoonSign(utcYear, utcMonth, utcDay, utcHour, utcMinute);
			
			// Calculate houses using UTC time and location coordinates
			houses = calculateHouses(utcYear, utcMonth, utcDay, utcHour, utcMinute, lat, lon);
			
			// Calculate all planet positions using exact birth time
			planets = calculateAllPlanets(utcYear, utcMonth, utcDay, utcHour, utcMinute);

			// Normalize and format the birth time for display
			// The time the user entered is already in the birth place's timezone
			normalizedTime = formatTime12Hour(hours, minutes);
			timezoneName = timezone || 'Local Time';
			
			// Detect if DST was in effect at the birth time
			if (timezone) {
				// Create a date object for the birth time (in UTC)
				const birthDateUTC = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute));
				
				// Create a date object for January 15 (standard time, typically no DST)
				const janDateUTC = new Date(Date.UTC(year, 0, 15, 12, 0));
				
				// Use Intl.DateTimeFormat to get timezone information
				const birthFormatter = new Intl.DateTimeFormat('en-US', {
					timeZone: timezone,
					timeZoneName: 'short'
				});
				const janFormatter = new Intl.DateTimeFormat('en-US', {
					timeZone: timezone,
					timeZoneName: 'short'
				});
				
				// Get timezone abbreviations (e.g., "PST", "PDT", "EST", "EDT")
				const birthParts = birthFormatter.formatToParts(birthDateUTC);
				const janParts = janFormatter.formatToParts(janDateUTC);
				
				const birthTZAbbr = birthParts.find(p => p.type === 'timeZoneName')?.value || '';
				const janTZAbbr = janParts.find(p => p.type === 'timeZoneName')?.value || '';
				
				// DST is typically indicated by:
				// 1. Timezone abbreviation containing 'D' (Daylight) - e.g., PDT, EDT, CDT
				// 2. Different abbreviation from January (standard time)
				isDST = birthTZAbbr.includes('DT') || 
				        (birthTZAbbr.length >= 3 && birthTZAbbr[1] === 'D') || // e.g., PDT, EDT, CDT
				        (birthTZAbbr !== janTZAbbr && birthTZAbbr.length > 0 && janTZAbbr.length > 0);
			} else {
				isDST = null;
			}

			// Save results to database
			try {
				const formData = new FormData();
				if (fullName) formData.append('fullName', fullName);
				if (lifeTrajectory) formData.append('lifeTrajectory', lifeTrajectory);
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
				// Add planet positions with house numbers
				if (planets) {
					const planetsWithHouses: Record<string, { sign: string; house?: number }> = {};
					for (const [planetName, planetSign] of Object.entries(planets)) {
						const planetLon = getPlanetLongitude(planetSign, utcYear, utcMonth, utcDay, planetName.charAt(0).toUpperCase() + planetName.slice(1), utcHour, utcMinute);
						const houseNumber = getPlanetHouse(planetLon, houses);
						planetsWithHouses[planetName] = {
							sign: planetSign,
							house: houseNumber
						};
					}
					formData.append('planets', JSON.stringify(planetsWithHouses));
				}
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
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'An error occurred while calculating your sun sign.';
			console.error('Calculation error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function generateAnalysis() {
		if (!sunSign || !moonSign || !ascendant || houses.length === 0 || !planets) {
			analysisError = 'Please calculate your chart first.';
			return;
		}

		isGeneratingAnalysis = true;
		analysisError = null;
		aiAnalysis = null;

		try {
			const formData = new FormData();
			formData.append('fullName', fullName);
			formData.append('lifeTrajectory', lifeTrajectory);
			formData.append('birthDate', birthDate);
			formData.append('birthTime', birthTime);
			formData.append('placeName', selectedPlace?.display_name || '');
			formData.append('sunSign', sunSign);
			formData.append('moonSign', moonSign);
			formData.append('ascendant', ascendant);
			formData.append('houses', JSON.stringify(houses));
			formData.append('planets', JSON.stringify(planets));
			formData.append('utcYear', String(utcYear));
			formData.append('utcMonth', String(utcMonth));
			formData.append('utcDay', String(utcDay));
			formData.append('utcHour', String(utcHour));
			formData.append('utcMinute', String(utcMinute));

			const response = await fetch('?/analyze', {
				method: 'POST',
				headers: {
					accept: 'application/json'
				},
				body: formData
			});

			// Check if response is OK
			if (!response.ok) {
				const text = await response.text();
				console.error('Response error:', response.status, text.substring(0, 200));
				if (text.includes('Cross-site') || text.includes('CSRF')) {
					throw new Error('CSRF protection error. Please refresh the page and try again.');
				}
				throw new Error(`Server error: ${response.status} ${response.statusText}`);
			}

			// Check content type before parsing JSON
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				const text = await response.text();
				console.error('Non-JSON response:', text.substring(0, 200));
				throw new Error('Invalid response format from server. Please refresh and try again.');
			}

			const responseData = await response.json();
			
			// SvelteKit actions return data in a specific format using devalue serialization
			// The data field is a JSON string that contains an array with references
			let result;
			if (typeof responseData.data === 'string') {
				try {
					const parsed = JSON.parse(responseData.data);
					
					// SvelteKit devalue format: [{"success":1,"analysis":2}, true, "analysis text"]
					// where 1 and 2 are array indices pointing to the actual values
					if (Array.isArray(parsed) && parsed.length >= 3 && parsed[0] && typeof parsed[0] === 'object') {
						const refs = parsed[0];
						// Check if this is a devalue reference map with numeric indices
						if (typeof refs.success === 'number' && typeof refs.analysis === 'number') {
							// Validate indices are within array bounds AND > 0 (never point to index 0, the reference map)
							if (refs.success > 0 && refs.success < parsed.length && 
							    refs.analysis > 0 && refs.analysis < parsed.length) {
								// Reconstruct the actual result object from the references
								result = {
									success: parsed[refs.success],
									analysis: parsed[refs.analysis]
								};
							} else {
								// Invalid indices - this shouldn't happen, but handle gracefully
								// Look for an actual result object in the array (not the reference map)
								result = parsed.find((item, index) => 
									index > 0 && // Skip index 0 (the reference map)
									item && typeof item === 'object' && 
									'success' in item && 'analysis' in item &&
									typeof item.success === 'boolean' && typeof item.analysis === 'string'
								);
								if (!result) {
									// Last resort: try to construct from array elements (skip index 0)
									if (parsed.length > 1 && parsed.length > 2) {
										result = { success: parsed[1], analysis: parsed[2] };
									} else {
										// Can't construct valid result - will be handled by error check below
										result = null;
									}
								}
							}
						} else {
							// Not a devalue reference map - parsed[0] might be the actual result
							// Check if it has actual boolean/string values (not reference indices)
							if (typeof refs.success === 'boolean' && typeof refs.analysis === 'string') {
								result = refs;
							} else {
								// Look for actual result object elsewhere in the array (skip index 0)
								result = parsed.find((item, index) => 
									index > 0 && // Skip index 0 (might be reference map or invalid)
									item && typeof item === 'object' && 
									'success' in item && 'analysis' in item &&
									typeof item.success === 'boolean' && typeof item.analysis === 'string'
								);
								// Don't fallback to parsed[0] - we've already determined it's invalid
							}
						}
					} else if (Array.isArray(parsed) && parsed.length >= 2) {
						// Alternative format: might be [result, ...]
						// Look for an object with actual success/analysis values
						result = parsed.find(item => 
							item && typeof item === 'object' && 
							'success' in item && 'analysis' in item &&
							typeof item.success === 'boolean' && typeof item.analysis === 'string'
						);
						// Don't fallback to parsed[0] - if no valid result found, result will be undefined
						// and will be handled by the error check below
					} else {
						result = parsed;
					}
				} catch (e: unknown) {
					console.error('Error parsing response data:', e);
					result = responseData.data;
				}
			} else {
				result = responseData.data || responseData;
			}

			// Handle the result
			if (result && result.success === true && result.analysis && typeof result.analysis === 'string') {
				aiAnalysis = result.analysis;
			} else if (result && result.success === false) {
				analysisError = result.error || 'Failed to generate analysis. Please check your PERPLEXITY_API_KEY in .env file.';
			} else {
				// Debug: log what we got
				console.error('Unexpected response format:', {
					result,
					type: typeof result,
					keys: result ? Object.keys(result) : null,
					hasSuccess: result && 'success' in result,
					hasAnalysis: result && 'analysis' in result,
					successValue: result && result.success,
					analysisValue: result && result.analysis,
					analysisType: result && result.analysis ? typeof result.analysis : 'none'
				});
				analysisError = 'Failed to generate analysis. Unexpected response format.';
			}
		} catch (err: unknown) {
			console.error('Error generating analysis:', err);
			analysisError = err instanceof Error ? err.message : 'Failed to generate analysis.';
		} finally {
			isGeneratingAnalysis = false;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.autocomplete-container')) {
			showSuggestions = false;
		}
	}

	async function generatePDF() {
		if (!sunSign || !ascendant || !moonSign || !selectedPlace) {
			error = 'Please calculate your chart first.';
			return;
		}

		isGeneratingPDF = true;
		error = null;

		try {
			// Generate AI analysis if not already available
			if (!aiAnalysis) {
				await generateAnalysis();

				// Check if analysis generation failed
				if (!aiAnalysis) {
					throw new Error(analysisError || 'Failed to generate AI analysis. Please try again.');
				}
			}

			const analysis = aiAnalysis;

			// Create PDF
			const doc = new jsPDF();
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();
			const margin = 20;
			const maxWidth = pageWidth - (margin * 2);
			let yPos = margin;

			// Color palette - Mystical celestial theme
			const colors = {
				deepPurple: [45, 20, 70] as [number, number, number],
				gold: [184, 134, 11] as [number, number, number],
				navy: [25, 25, 112] as [number, number, number],
				silver: [192, 192, 192] as [number, number, number],
				mysticPurple: [75, 0, 130] as [number, number, number],
				darkText: [20, 20, 40] as [number, number, number],
				accent: [138, 43, 226] as [number, number, number]
			};

			// Helper function to draw decorative border on page
			const drawPageBorder = () => {
				// Outer border with double lines
				doc.setDrawColor(...colors.gold);
				doc.setLineWidth(0.5);
				doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
				doc.setLineWidth(0.3);
				doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

				// Corner stars
				doc.setFontSize(16);
				doc.setTextColor(...colors.gold);
				doc.setFont('times', 'normal');
				doc.text('✦', 8, 12);
				doc.text('✦', pageWidth - 12, 12);
				doc.text('✦', 8, pageHeight - 8);
				doc.text('✦', pageWidth - 12, pageHeight - 8);
			};

			// Helper function to add ornamental divider
			const addDivider = () => {
				const centerX = pageWidth / 2;
				doc.setDrawColor(...colors.silver);
				doc.setLineWidth(0.3);

				// Left line
				doc.line(margin + 10, yPos, centerX - 15, yPos);
				// Right line
				doc.line(centerX + 15, yPos, pageWidth - margin - 10, yPos);

				// Center ornament
				doc.setFontSize(10);
				doc.setTextColor(...colors.gold);
				doc.text('✧ ⋆ ✧', centerX, yPos + 1, { align: 'center' });

				yPos += 8;
			};

			// Helper function to add text with wrapping
			const addText = (text: string, fontSize: number = 11, isBold: boolean = false, color: [number, number, number] = colors.darkText, font: string = 'times') => {
				doc.setFontSize(fontSize);
				doc.setFont(font, isBold ? 'bold' : 'normal');
				doc.setTextColor(color[0], color[1], color[2]);

				const lines = doc.splitTextToSize(text, maxWidth);
				for (const line of lines) {
					if (yPos > pageHeight - margin - 5) {
						doc.addPage();
						drawPageBorder();
						yPos = margin + 5;
					}
					doc.text(line, margin, yPos);
					yPos += fontSize * 0.5;
				}
				yPos += 5;
			};

			// Helper function for section headers
			const addSectionHeader = (text: string, symbol: string = '✦') => {
				if (yPos > pageHeight - margin - 20) {
					doc.addPage();
					drawPageBorder();
					yPos = margin + 5;
				}

				const centerX = pageWidth / 2;
				doc.setFontSize(16);
				doc.setFont('times', 'bold');
				doc.setTextColor(...colors.navy);

				// Add decorative symbols
				doc.setTextColor(...colors.gold);
				doc.text(symbol, centerX - doc.getTextWidth(text) / 2 - 8, yPos);
				doc.text(symbol, centerX + doc.getTextWidth(text) / 2 + 5, yPos);

				// Add section title
				doc.setTextColor(...colors.navy);
				doc.text(text, centerX, yPos, { align: 'center' });

				yPos += 10;
			};

			// Draw first page border
			drawPageBorder();
			yPos = margin + 10;

			// Title with celestial decoration
			doc.setFontSize(24);
			doc.setFont('times', 'bold');
			doc.setTextColor(...colors.deepPurple);
			const titleText = 'Astrological Chart';
			const titleWidth = doc.getTextWidth(titleText);
			const centerX = pageWidth / 2;
			doc.text(titleText, centerX, yPos, { align: 'center' });
			yPos += 8;

			doc.setFontSize(18);
			doc.setFont('times', 'italic');
			doc.setTextColor(...colors.mysticPurple);
			doc.text('Celestial Blueprint', centerX, yPos, { align: 'center' });
			yPos += 10;

			// Decorative stars under title
			doc.setFontSize(12);
			doc.setTextColor(...colors.gold);
			doc.text('✧ ⋆ ✦ ⋆ ✧', centerX, yPos, { align: 'center' });
			yPos += 12;

			addDivider();

			// Birth Information
			addSectionHeader('Birth Information', '☾');
			if (fullName) {
				doc.setFont('times', 'italic');
				doc.setTextColor(...colors.navy);
				addText(`${fullName}`, 13, false, colors.navy);
			}
			addText(`Born: ${birthDate}`, 11, false, colors.darkText);
			addText(`Time: ${normalizedTime || birthTime}${timezoneName ? ` (${timezoneName}${isDST !== null ? ', ' + (isDST ? 'DST' : 'Standard') : ''})` : ''}`, 11, false, colors.darkText);
			addText(`Location: ${selectedPlace.display_name}`, 11, false, colors.darkText);
			if (lifeTrajectory) {
				addText(`Life Path: ${lifeTrajectory}`, 11, true, colors.accent);
			}
			yPos += 8;
			addDivider();

			// Add Celestial Chart Visualization
			try {
				const chartSvg = document.querySelector('.chart-svg');
				if (chartSvg) {
					// Convert SVG to canvas
					const svgData = new XMLSerializer().serializeToString(chartSvg);
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');
					const img = new Image();

					// Wait for image to load
					await new Promise<void>((resolve, reject) => {
						img.onload = () => {
							canvas.width = 600;
							canvas.height = 600;
							if (ctx) {
								// White background
								ctx.fillStyle = '#ffffff';
								ctx.fillRect(0, 0, canvas.width, canvas.height);
								ctx.drawImage(img, 0, 0);
							}
							resolve();
						};
						img.onerror = reject;
						img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
					});

					// Add chart to PDF
					const imgData = canvas.toDataURL('image/png');
					const chartWidth = maxWidth; // Fill page width
					const chartHeight = maxWidth; // Keep square aspect ratio
					const chartX = margin; // Align to margin

					if (yPos + chartHeight > pageHeight - margin - 25) {
						doc.addPage();
						drawPageBorder();
						yPos = margin + 5;
					}

					addSectionHeader('Celestial Chart', '✦');
					yPos += 5;

					// Add decorative frame around chart
					doc.setDrawColor(...colors.gold);
					doc.setLineWidth(0.8);
					doc.rect(chartX - 2, yPos - 2, chartWidth + 4, chartHeight + 4);

					doc.addImage(imgData, 'PNG', chartX, yPos, chartWidth, chartHeight);
					yPos += chartHeight + 12;
					addDivider();
				}
			} catch (chartErr: unknown) {
				console.warn('Could not add chart to PDF:', chartErr);
				// Continue without chart if there's an error
			}

			// Core Signs
			addSectionHeader('The Trinity of Self', '☉');

			// Sun Sign
			doc.setFontSize(13);
			doc.setFont('times', 'bold');
			doc.setTextColor(...colors.gold);
			addText(`☉ Sun Sign: ${sunSign}`, 13, true, colors.gold);
			if (sunSignData) {
				doc.setFont('times', 'italic');
				addText(`${sunSignData.element} • ${sunSignData.modality} • Ruled by ${sunSignData.ruler}`, 10, false, colors.silver);
				addText(getSignDescription(sunSign, 'sun'), 10, false, colors.darkText);
			}
			yPos += 5;

			// Moon Sign
			doc.setFont('times', 'bold');
			addText(`☽ Moon Sign: ${moonSign}`, 13, true, colors.mysticPurple);
			if (moonSignData) {
				doc.setFont('times', 'italic');
				addText(`${moonSignData.element} • ${moonSignData.modality} • Ruled by ${moonSignData.ruler}`, 10, false, colors.silver);
				addText(getSignDescription(moonSign, 'moon'), 10, false, colors.darkText);
			}
			yPos += 5;

			// Ascendant
			doc.setFont('times', 'bold');
			addText(`⇑ Ascendant (Rising): ${ascendant}`, 13, true, colors.navy);
			if (ascendantSignData) {
				doc.setFont('times', 'italic');
				addText(`${ascendantSignData.element} • ${ascendantSignData.modality} • Ruled by ${ascendantSignData.ruler}`, 10, false, colors.silver);
				addText(getSignDescription(ascendant, 'ascendant'), 10, false, colors.darkText);
			}
			yPos += 8;
			addDivider();

			// Planetary Positions
			if (planets) {
				addSectionHeader('Planetary Positions', '★');

				const planetSymbols: Record<string, string> = {
					mercury: '☿',
					venus: '♀',
					mars: '♂',
					jupiter: '♃',
					saturn: '♄',
					uranus: '♅',
					neptune: '♆',
					pluto: '♇'
				};

				const planetOrder = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
				for (const planetName of planetOrder) {
					if (planets[planetName as keyof typeof planets]) {
						const planetSign = planets[planetName as keyof typeof planets];
						const planetLon = getPlanetLongitude(planetSign!, utcYear, utcMonth, utcDay, planetName.charAt(0).toUpperCase() + planetName.slice(1), utcHour, utcMinute);
						const planetHouse = getPlanetHouse(planetLon, houses);
						const symbol = planetSymbols[planetName] || '●';

						doc.setFont('times', 'bold');
						addText(`${symbol} ${planetName.charAt(0).toUpperCase() + planetName.slice(1)} in ${planetSign}${planetHouse ? ` • House ${planetHouse}` : ''}`, 11, true, colors.navy);

						const planetDesc = getPlanetDescription(planetName, planetSign!);
						if (planetDesc?.description) {
							addText(planetDesc.description, 10, false, colors.darkText);
						}
						yPos += 4;
					}
				}
				yPos += 5;
				addDivider();
			}

			// Houses
			if (houses.length > 0) {
				addSectionHeader('The Twelve Houses', '⌂');

				for (const house of houses) {
					const houseInfo = getHouseInfo(house.number);
					if (houseInfo) {
						doc.setFont('times', 'bold');
						addText(`House ${house.number} • ${houseInfo.alias} in ${house.sign}`, 11, true, colors.accent);
						addText(houseInfo.description, 10, false, colors.darkText);
						yPos += 4;
					}
				}
			}

			// AI Assessment - New decorated page
			doc.addPage();
			drawPageBorder();
			yPos = margin + 10;

			// Mystical header
			doc.setFontSize(20);
			doc.setFont('times', 'bold');
			doc.setTextColor(...colors.deepPurple);
			doc.text('Mystical Analysis', centerX, yPos, { align: 'center' });
			yPos += 8;

			doc.setFontSize(14);
			doc.setFont('times', 'italic');
			doc.setTextColor(...colors.mysticPurple);
			doc.text('An Interpretation of Your Celestial Blueprint', centerX, yPos, { align: 'center' });
			yPos += 8;

			// Decorative stars
			doc.setFontSize(10);
			doc.setTextColor(...colors.gold);
			doc.text('✧ ⋆ ✦ ⋆ ✧', centerX, yPos, { align: 'center' });
			yPos += 10;

			addDivider();
			yPos += 5;

			addText(analysis, 10, false, colors.darkText);

			// Save the PDF
			const fileName = fullName
				? `${fullName.replace(/\s+/g, '_')}_Astrology_Chart.pdf`
				: `Astrology_Chart_${birthDate}.pdf`;
			doc.save(fileName);

		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'An error occurred while generating the PDF.';
			console.error('PDF generation error:', err);
		} finally {
			isGeneratingPDF = false;
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
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="keywords" content={data.seo.keywords} />
	<meta name="author" content={data.seo.author} />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={data.seo.type} />
	<meta property="og:url" content={data.seo.url} />
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />
	<meta property="og:image" content={data.seo.image} />
	<meta property="og:site_name" content="Zodiac Chart Calculator" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={data.seo.url} />
	<meta name="twitter:title" content={data.seo.title} />
	<meta name="twitter:description" content={data.seo.description} />
	<meta name="twitter:image" content={data.seo.image} />
	
	<!-- Additional SEO -->
	<link rel="canonical" href={data.seo.url} />
	<meta name="robots" content="index, follow" />
	<meta name="theme-color" content="#ff3e00" />
</svelte:head>

<div class="container">
	<div class="card">
		<h1>Zodiac Calculator</h1>
		<p class="subtitle">
			Enter your birth details to discover your sun sign and astrological houses
		</p>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				calculateSign();
			}}
			class="form"
		>
			<div class="form-group">
				<label for="fullname">Full Name (optional)</label>
				<input type="text" id="fullname" bind:value={fullName} class="input" placeholder="Enter your full name" />
			</div>

			<div class="form-group">
				<label for="lifetrajectory">Life trajectory assessment (optional)</label>
				<select id="lifetrajectory" bind:value={lifeTrajectory} class="input">
					<option value="">Select trajectory...</option>
					<option value="down">Down</option>
					<option value="slightly down">Slightly down</option>
					<option value="neutral">Neutral</option>
					<option value="slightly up">Slightly up</option>
					<option value="up">Up</option>
				</select>
			</div>

			<div class="form-group">
				<label for="birthdate">Birth Date</label>
				<input type="date" id="birthdate" bind:value={birthDate} required class="input" />
			</div>

			<div class="form-group">
				<label for="birthtime">Birth Time</label>
				<input type="time" id="birthtime" bind:value={birthTime} required class="input" />
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
						{#each suggestions as suggestion (suggestion.lat + '-' + suggestion.lon)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<li onclick={() => selectPlace(suggestion)} class="suggestion-item">
								{suggestion.display_name}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<button type="submit" disabled={isLoading} class="button">
				{isLoading ? 'Calculating...' : 'Calculate Chart'}
			</button>

			{#if sunSign && ascendant && moonSign}
				<button
					type="button"
					disabled={isGeneratingPDF || isGeneratingAnalysis}
					onclick={generatePDF}
					class="button button-pdf"
				>
					{#if isGeneratingPDF && isGeneratingAnalysis}
						Generating AI analysis...
					{:else if isGeneratingPDF}
						Creating PDF...
					{:else}
						📄 Generate PDF with AI Analysis
					{/if}
				</button>
			{/if}
		</form>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		{#if sunSign && ascendant && moonSign}
			<div class="result">
				{#if normalizedTime}
					<div class="birth-info">
						<div class="birth-info-item">
							<strong>Birth Date:</strong> {birthDate}
						</div>
						<div class="birth-info-item">
							<strong>Birth Time:</strong> {normalizedTime}
							{#if timezoneName}
								<span class="timezone-info">
									({timezoneName}
									{#if isDST !== null}
										, {isDST ? 'Daylight Saving Time' : 'Standard Time'}
									{/if})
								</span>
							{/if}
						</div>
						{#if selectedPlace}
							<div class="birth-info-item">
								<strong>Birth Place:</strong> {selectedPlace.display_name}
							</div>
						{/if}
					</div>
				{/if}
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
											{#each getCorePointKeywords('sun') as keyword (keyword)}
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
											{#each getSignKeywords(sunSign, 'sun') as keyword (keyword)}
												<span class="keyword">{keyword}</span>
											{/each}
										</div>
									{/if}
									{#if houses.length > 0}
										{@const sunLon = getPlanetLongitude(sunSign, utcYear, utcMonth, utcDay, 'Sun', utcHour, utcMinute)}
										{@const sunHouse = getPlanetHouse(sunLon, houses)}
										{#if sunHouse}
											{@const housePlacement = getHousePlacementDescription('sun', sunHouse)}
											{#if housePlacement}
												<div class="house-placement">
													<div class="house-placement-title">Sun in House {sunHouse}</div>
													<div class="house-placement-description">{housePlacement}</div>
												</div>
											{/if}
										{/if}
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
											{#each getCorePointKeywords('moon') as keyword (keyword)}
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
											{#each getSignKeywords(moonSign, 'moon') as keyword (keyword)}
												<span class="keyword">{keyword}</span>
											{/each}
										</div>
									{/if}
									{#if houses.length > 0}
										{@const moonLon = getPlanetLongitude(moonSign, utcYear, utcMonth, utcDay, 'Moon', utcHour, utcMinute)}
										{@const moonHouse = getPlanetHouse(moonLon, houses)}
										{#if moonHouse}
											{@const housePlacement = getHousePlacementDescription('moon', moonHouse)}
											{#if housePlacement}
												<div class="house-placement">
													<div class="house-placement-title">Moon in House {moonHouse}</div>
													<div class="house-placement-description">{housePlacement}</div>
												</div>
											{/if}
										{/if}
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
									<span class="badge badge-{ascendantSignData.element}"
										>{ascendantSignData.element}</span
									>
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
											{#each getCorePointKeywords('ascendant') as keyword (keyword)}
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
											{#each getSignKeywords(ascendant, 'ascendant') as keyword (keyword)}
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
			<Chart 
				{sunSign} 
				{ascendant} 
				{moonSign} 
				{houses} 
				{planets}
				{utcYear}
				{utcMonth}
				{utcDay}
				{utcHour}
				{utcMinute}
			/>
		{/if}

		{#if houses.length > 0}
			<div class="houses-result">
				<h2>Your Astrological Houses</h2>
				<div class="houses-grid">
					{#each houses as house (house.number)}
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
										{#each houseInfo.keywords as keyword (keyword)}
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

		{#if planets}
			<div class="planets-result">
				<h2>Planetary Positions</h2>
				<div class="planets-grid">
					<!-- Personal Planets -->
					<div class="planet-category">
						<h3>Personal Planets</h3>
						<div class="planets-list">
							{#if planets.mercury}
								{@const planetDesc = getPlanetDescription('mercury', planets.mercury)}
								{@const mercuryLon = getPlanetLongitude(planets.mercury, utcYear, utcMonth, utcDay, 'Mercury', utcHour, utcMinute)}
								{@const planetHouse = getPlanetHouse(mercuryLon, houses)}
								<div class="planet-item">
									<div class="planet-header">
										<div class="planet-name">Mercury</div>
										<div class="planet-sign">{planets.mercury}</div>
										{#if planetHouse}
											<div class="planet-house">House {planetHouse}</div>
										{/if}
									</div>
									{#if planetDesc}
										<div class="planet-description">{planetDesc.description}</div>
										{#if planetDesc.keywords && planetDesc.keywords.length > 0}
											<div class="keywords">
												<span class="keywords-label">Keywords:</span>
												{#each planetDesc.keywords as keyword (keyword)}
													<span class="keyword">{keyword}</span>
												{/each}
											</div>
										{/if}
									{/if}
								</div>
							{/if}
							{#if planets.venus}
								{@const planetDesc = getPlanetDescription('venus', planets.venus)}
								{@const venusLon = getPlanetLongitude(planets.venus, utcYear, utcMonth, utcDay, 'Venus', utcHour, utcMinute)}
								{@const planetHouse = getPlanetHouse(venusLon, houses)}
								<div class="planet-item">
									<div class="planet-header">
										<div class="planet-name">Venus</div>
										<div class="planet-sign">{planets.venus}</div>
										{#if planetHouse}
											<div class="planet-house">House {planetHouse}</div>
										{/if}
									</div>
									{#if planetDesc}
										<div class="planet-description">{planetDesc.description}</div>
										{#if planetDesc.keywords && planetDesc.keywords.length > 0}
											<div class="keywords">
												<span class="keywords-label">Keywords:</span>
												{#each planetDesc.keywords as keyword (keyword)}
													<span class="keyword">{keyword}</span>
												{/each}
											</div>
										{/if}
									{/if}
								</div>
							{/if}
							{#if planets.mars}
								{@const planetDesc = getPlanetDescription('mars', planets.mars)}
								{@const marsLon = getPlanetLongitude(planets.mars, utcYear, utcMonth, utcDay, 'Mars', utcHour, utcMinute)}
								{@const planetHouse = getPlanetHouse(marsLon, houses)}
								<div class="planet-item">
									<div class="planet-header">
										<div class="planet-name">Mars</div>
										<div class="planet-sign">{planets.mars}</div>
										{#if planetHouse}
											<div class="planet-house">House {planetHouse}</div>
										{/if}
									</div>
									{#if planetDesc}
										<div class="planet-description">{planetDesc.description}</div>
										{#if planetDesc.keywords && planetDesc.keywords.length > 0}
											<div class="keywords">
												<span class="keywords-label">Keywords:</span>
												{#each planetDesc.keywords as keyword (keyword)}
													<span class="keyword">{keyword}</span>
												{/each}
											</div>
										{/if}
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Social Planets -->
					<div class="planet-category">
						<h3>Social Planets</h3>
						<div class="planets-list">
							{#if planets.jupiter}
								{@const planetDesc = getPlanetDescription('jupiter', planets.jupiter)}
								{@const jupiterLon = getPlanetLongitude(planets.jupiter, utcYear, utcMonth, utcDay, 'Jupiter', utcHour, utcMinute)}
								{@const planetHouse = getPlanetHouse(jupiterLon, houses)}
								<div class="planet-item">
									<div class="planet-header">
										<div class="planet-name">Jupiter</div>
										<div class="planet-sign">{planets.jupiter}</div>
										{#if planetHouse}
											<div class="planet-house">House {planetHouse}</div>
										{/if}
									</div>
									{#if planetDesc}
										<div class="planet-description">{planetDesc.description}</div>
									{/if}
								</div>
							{/if}
							{#if planets.saturn}
								{@const planetDesc = getPlanetDescription('saturn', planets.saturn)}
								{@const saturnLon = getPlanetLongitude(planets.saturn, utcYear, utcMonth, utcDay, 'Saturn', utcHour, utcMinute)}
								{@const planetHouse = getPlanetHouse(saturnLon, houses)}
								<div class="planet-item">
									<div class="planet-header">
										<div class="planet-name">Saturn</div>
										<div class="planet-sign">{planets.saturn}</div>
										{#if planetHouse}
											<div class="planet-house">House {planetHouse}</div>
										{/if}
									</div>
									{#if planetDesc}
										<div class="planet-description">{planetDesc.description}</div>
									{/if}
									{#if planetHouse}
										{@const housePlacement = getHousePlacementDescription('saturn', planetHouse)}
										{#if housePlacement}
											<div class="house-placement">
												<div class="house-placement-title">Saturn in House {planetHouse}</div>
												<div class="house-placement-description">{housePlacement}</div>
											</div>
										{/if}
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Outer Planets -->
					<div class="planet-category">
						<h3>Generational Planets</h3>
						<div class="planets-list">
							{#if planets.uranus}
								{@const uranusLon = getPlanetLongitude(planets.uranus, utcYear, utcMonth, utcDay, 'Uranus', utcHour, utcMinute)}
								{@const planetHouse = getPlanetHouse(uranusLon, houses)}
								<div class="planet-item">
									<div class="planet-header">
										<div class="planet-name">Uranus</div>
										<div class="planet-sign">{planets.uranus}</div>
										{#if planetHouse}
											<div class="planet-house">House {planetHouse}</div>
										{/if}
									</div>
									<div class="planet-description">
										{planetsData.planetary_sign_details.outer_planets.uranus.description}
									</div>
								</div>
							{/if}
							{#if planets.neptune}
								{@const neptuneLon = getPlanetLongitude(planets.neptune, utcYear, utcMonth, utcDay, 'Neptune', utcHour, utcMinute)}
								{@const planetHouse = getPlanetHouse(neptuneLon, houses)}
								<div class="planet-item">
									<div class="planet-header">
										<div class="planet-name">Neptune</div>
										<div class="planet-sign">{planets.neptune}</div>
										{#if planetHouse}
											<div class="planet-house">House {planetHouse}</div>
										{/if}
									</div>
									<div class="planet-description">
										{planetsData.planetary_sign_details.outer_planets.neptune.description}
									</div>
								</div>
							{/if}
							{#if planets.pluto}
								{@const plutoLon = getPlanetLongitude(planets.pluto, utcYear, utcMonth, utcDay, 'Pluto', utcHour, utcMinute)}
								{@const planetHouse = getPlanetHouse(plutoLon, houses)}
								<div class="planet-item">
									<div class="planet-header">
										<div class="planet-name">Pluto</div>
										<div class="planet-sign">{planets.pluto}</div>
										{#if planetHouse}
											<div class="planet-house">House {planetHouse}</div>
										{/if}
									</div>
									<div class="planet-description">
										{planetsData.planetary_sign_details.outer_planets.pluto.description}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- AI Analysis Section -->
		{#if sunSign && moonSign && ascendant && houses.length > 0 && planets}
			<div class="analysis-section">
				<h2>Mystical Astrological Analysis</h2>
				<p class="analysis-description">
					Get a deeper interpretation of this chart with an analysis of planets and houses.
				</p>
				
				{#if !aiAnalysis && !isGeneratingAnalysis}
					<button 
						type="button" 
						class="analyze-button"
						onclick={generateAnalysis}
					>
						✨ Get Analysis Results
					</button>
				{/if}

				{#if isGeneratingAnalysis}
					<div class="analysis-loading">
						<div class="spinner"></div>
						<p>Analysing...</p>
					</div>
				{/if}

				{#if analysisError}
					<div class="analysis-error">
						<p>{analysisError}</p>
						{#if analysisError.includes('PERPLEXITY_API_KEY')}
							<p class="env-hint">
								To enable AI analysis, create a <code>.env</code> file in the project root and add:<br>
								<code>PERPLEXITY_API_KEY=your_api_key_here</code>
							</p>
						{/if}
					</div>
				{/if}

				{#if aiAnalysis}
					<div class="analysis-result">
						<div class="analysis-content">
							{#each aiAnalysis.split('\n') as paragraph, index (index)}
								{#if paragraph.trim()}
									<p>{paragraph}</p>
								{/if}
							{/each}
						</div>
						<button 
							type="button" 
							class="regenerate-button"
							onclick={generateAnalysis}
						>
							🔄 Regenerate Analysis
						</button>
					</div>
				{/if}
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

	.button-pdf {
		background: #dc2626;
		margin-top: 1rem;
	}

	.button-pdf:hover:not(:disabled) {
		background: #b91c1c;
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

	.birth-info {
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.birth-info-item {
		font-size: 0.95rem;
		line-height: 1.8;
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	.birth-info-item:last-child {
		margin-bottom: 0;
	}

	.birth-info-item strong {
		color: var(--color-theme-1);
		font-weight: 600;
		margin-right: 0.5rem;
	}

	.timezone-info {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin-left: 0.25rem;
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
		transition:
			transform 0.2s,
			box-shadow 0.2s;
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
		transition:
			transform 0.2s,
			box-shadow 0.2s;
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

	.planets-result {
		margin-top: 2rem;
		padding: 2rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.planets-result h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 2rem 0;
		color: var(--color-text);
		text-align: center;
	}

	.planets-grid {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.planet-category {
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.planet-category h3 {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
		color: var(--color-text);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.planets-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.planet-item {
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1.25rem;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.planet-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.planet-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
		flex-wrap: wrap;
	}

	.planet-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.planet-sign {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-theme-1);
		padding: 0.25rem 0.6rem;
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}

	.planet-house {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--color-text-muted);
		padding: 0.25rem 0.6rem;
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}

	.planet-description {
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	.house-placement {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.house-placement-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-theme-1);
		margin-bottom: 0.5rem;
	}

	.house-placement-description {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.analysis-section {
		margin-top: 3rem;
		padding: 2rem;
		background: var(--color-bg-1);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}

	.analysis-section h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--color-text);
		text-align: center;
	}

	.analysis-description {
		text-align: center;
		color: var(--color-text-muted);
		margin: 0 0 1.5rem 0;
		font-size: 0.95rem;
	}

	.analyze-button,
	.regenerate-button {
		display: block;
		margin: 0 auto;
		padding: 1rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-bg-1);
		background: var(--color-theme-1);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.analyze-button:hover,
	.regenerate-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.analyze-button:active,
	.regenerate-button:active {
		transform: translateY(0);
	}

	.analysis-loading {
		text-align: center;
		padding: 2rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--color-border);
		border-top-color: var(--color-theme-1);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.analysis-loading p {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.analysis-error {
		padding: 1.5rem;
		background: rgba(220, 53, 69, 0.1);
		border: 1px solid rgba(220, 53, 69, 0.3);
		border-radius: 8px;
		color: var(--color-text);
		text-align: center;
	}

	.analysis-error p {
		margin: 0.5rem 0;
	}

	.env-hint {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--color-bg-2);
		border-radius: 4px;
		font-size: 0.85rem;
		text-align: left;
	}

	.env-hint code {
		background: var(--color-bg-1);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: 'Fira Mono', monospace;
	}

	.analysis-result {
		margin-top: 2rem;
	}

	.analysis-content {
		background: var(--color-bg-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2rem;
		line-height: 1.8;
		color: var(--color-text);
		font-size: 1rem;
	}

	:global(.analysis-content p) {
		margin: 1rem 0;
	}

	:global(.analysis-content p:first-child) {
		margin-top: 0;
	}

	:global(.analysis-content p:last-child) {
		margin-bottom: 0;
	}

	.regenerate-button {
		margin-top: 1.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 0.9rem;
	}

	@media (max-width: 640px) {
		.card {
			padding: 1.5rem;
			border-width: 0.5px;
		}

		h1 {
			font-size: 1.75rem;
		}

		.subtitle {
			font-size: 0.875rem;
		}

		.form {
			gap: 1.25rem;
		}

		.button {
			padding: 0.75rem 1rem;
			font-size: 0.95rem;
		}

		.button-pdf {
			margin-top: 0.75rem;
		}

		.result {
			padding: 1.5rem;
			border-width: 0.5px;
		}

		.result h2 {
			font-size: 1.25rem;
		}

		.birth-info {
			padding: 1rem;
			border-width: 0.5px;
		}

		.birth-info-item {
			font-size: 0.875rem;
			margin-bottom: 0.5rem;
		}

		.sign-item {
			padding: 1.5rem;
			border-width: 0.5px;
		}

		.sign-header {
			border-bottom-width: 0.5px;
		}

		.sign-name {
			font-size: 1.5rem;
		}

		.sign-metadata {
			gap: 0.4rem;
		}

		.badge {
			padding: 0.3rem 0.6rem;
			font-size: 0.75rem;
			border-width: 0.5px;
		}

		.core-point-info,
		.placement-info {
			padding: 1rem;
			border-width: 0.5px;
		}

		.keywords {
			border-top-width: 0.5px;
		}

		.houses-result,
		.planets-result {
			padding: 1.5rem;
			border-width: 0.5px;
		}

		.houses-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.house-item {
			padding: 1.25rem;
			border-width: 0.5px;
		}

		.house-header {
			border-bottom-width: 0.5px;
		}

		.planet-category {
			padding: 1.25rem;
			border-width: 0.5px;
		}

		.planet-item {
			padding: 1rem;
			border-width: 0.5px;
		}

		.planet-header {
			gap: 0.75rem;
			border-bottom-width: 0.5px;
		}

		.house-placement {
			border-top-width: 0.5px;
		}

		.input {
			border-width: 0.5px;
		}

		.suggestions {
			border-width: 0.5px;
			border-top: none;
		}

		.suggestion-item {
			border-bottom-width: 0.5px;
		}

		.error {
			border-width: 0.5px;
		}
	}

	@media (max-width: 420px) {
		.container {
			padding: 1rem 0.5rem;
		}

		.card {
			padding: 1rem;
			border-radius: 6px;
			border-width: 0.5px;
		}

		h1 {
			font-size: 1.5rem;
		}

		.subtitle {
			font-size: 0.8rem;
			margin-bottom: 1.5rem;
		}

		.form {
			gap: 1rem;
		}

		.form-group {
			gap: 0.4rem;
		}

		label {
			font-size: 0.85rem;
		}

		.input {
			padding: 0.65rem;
			font-size: 0.95rem;
			border-width: 0.5px;
		}

		.button {
			padding: 0.7rem 0.9rem;
			font-size: 0.9rem;
		}

		.button-pdf {
			margin-top: 0.65rem;
			white-space: normal;
			line-height: 1.3;
		}

		.result {
			padding: 1rem;
			border-width: 0.5px;
		}

		.result h2 {
			font-size: 1.15rem;
			margin-bottom: 1rem;
		}

		.birth-info {
			padding: 0.875rem;
			border-width: 0.5px;
		}

		.birth-info-item {
			font-size: 0.825rem;
			line-height: 1.6;
			margin-bottom: 0.5rem;
		}

		.birth-info-item strong {
			display: block;
			margin-bottom: 0.15rem;
		}

		.timezone-info {
			font-size: 0.8rem;
			display: block;
			margin-left: 0;
			margin-top: 0.15rem;
		}

		.signs-list {
			gap: 1.5rem;
		}

		.sign-item {
			padding: 1.25rem;
			border-width: 0.5px;
		}

		.sign-header {
			margin-bottom: 1.25rem;
			padding-bottom: 0.875rem;
			border-bottom-width: 0.5px;
		}

		.sign-label {
			font-size: 0.8rem;
		}

		.sign-name {
			font-size: 1.35rem;
			margin-bottom: 0.75rem;
		}

		.sign-metadata {
			gap: 0.35rem;
		}

		.badge {
			padding: 0.25rem 0.5rem;
			font-size: 0.7rem;
			border-width: 0.5px;
		}

		.sign-content {
			gap: 1.25rem;
		}

		.core-point-info,
		.placement-info {
			padding: 0.875rem;
			border-width: 0.5px;
		}

		.core-point-role,
		.placement-title {
			font-size: 0.925rem;
		}

		.core-point-description,
		.placement-description {
			font-size: 0.875rem;
			line-height: 1.5;
		}

		.keywords {
			gap: 0.4rem;
			margin-top: 0.65rem;
			padding-top: 0.65rem;
			border-top-width: 0.5px;
		}

		.keywords-label {
			font-size: 0.75rem;
		}

		.keyword {
			padding: 0.2rem 0.5rem;
			font-size: 0.75rem;
		}

		.houses-result,
		.planets-result {
			padding: 1.25rem;
			border-width: 0.5px;
		}

		.houses-result h2,
		.planets-result h2 {
			font-size: 1.1rem;
			margin-bottom: 1rem;
		}

		.houses-grid {
			gap: 0.875rem;
		}

		.house-item {
			padding: 1rem;
			border-width: 0.5px;
		}

		.house-header {
			border-bottom-width: 0.5px;
		}

		.house-number,
		.house-sign {
			font-size: 0.8rem;
			border-width: 0.5px;
		}

		.house-alias {
			font-size: 0.925rem;
		}

		.house-description {
			font-size: 0.8rem;
		}

		.planet-category {
			padding: 1rem;
			border-width: 0.5px;
		}

		.planet-category h3 {
			font-size: 1rem;
			margin-bottom: 1rem;
		}

		.planets-list {
			gap: 1.25rem;
		}

		.planet-item {
			padding: 0.875rem;
			border-width: 0.5px;
		}

		.planet-header {
			gap: 0.65rem;
			margin-bottom: 0.65rem;
			padding-bottom: 0.65rem;
			border-bottom-width: 0.5px;
		}

		.planet-name {
			font-size: 1rem;
		}

		.planet-sign,
		.planet-house {
			font-size: 0.825rem;
			padding: 0.2rem 0.5rem;
			border-width: 0.5px;
		}

		.planet-description {
			font-size: 0.85rem;
			line-height: 1.55;
		}

		.house-placement {
			margin-top: 0.875rem;
			padding-top: 0.875rem;
			border-top-width: 0.5px;
		}

		.house-placement-title {
			font-size: 0.85rem;
		}

		.house-placement-description {
			font-size: 0.8rem;
		}

		.error {
			margin-top: 1rem;
			padding: 0.875rem;
			font-size: 0.85rem;
			border-width: 0.5px;
		}

		.suggestions {
			border-width: 0.5px;
		}

		.suggestion-item {
			padding: 0.65rem;
			font-size: 0.9rem;
			border-bottom-width: 0.5px;
		}
	}
</style>
