import generalData from '../../../../data/general.json';
import planetsData from '../../../../data/planets.json';

export interface ChartData {
	fullName?: string | null;
	lifeTrajectory?: string | null;
	birthDate: string;
	birthTime: string;
	placeName: string;
	sunSign: string;
	ascendant: string;
	moonSign: string;
	planets: Record<string, { sign: string; house?: number }>;
	houses: Array<{ number: number; sign: string }>;
}

export interface PromptArtifacts {
	systemInstruction: string;
	userPrompt: string;
}

function getSignData(sign: string | null | undefined) {
	if (!sign) return null;
	const signKey = sign.toLowerCase();
	return generalData.zodiac_signs[signKey as keyof typeof generalData.zodiac_signs] || null;
}

function getPlanetDescription(planet: string, sign: string | null | undefined) {
	if (!sign) return null;
	const signKey = sign.toLowerCase();
	const planetData =
		planetsData.planetary_sign_details[planet as keyof typeof planetsData.planetary_sign_details];
	if (!planetData || typeof planetData !== 'object') return null;

	const signData = (planetData as Record<string, unknown>)[signKey];
	return signData || null;
}

function getHouseInfo(houseNumber: number) {
	const houseKey = String(houseNumber);
	return generalData.info.houses[houseKey as keyof typeof generalData.info.houses];
}

export function buildMysticalAnalysisPrompt(chartData: ChartData): PromptArtifacts {
	const sunSignData = getSignData(chartData.sunSign);
	const moonSignData = getSignData(chartData.moonSign);
	const ascendantSignData = getSignData(chartData.ascendant);

	const planetDescriptions: string[] = [];

	const sunDescription = getSignData(chartData.sunSign);
	if (sunDescription?.sun) {
		planetDescriptions.push(`Sun in ${chartData.sunSign}: ${sunDescription.sun.description}`);
	}

	const moonDescription = getSignData(chartData.moonSign);
	if (moonDescription?.moon) {
		planetDescriptions.push(`Moon in ${chartData.moonSign}: ${moonDescription.moon.description}`);
	}

	for (const [planet, position] of Object.entries(chartData.planets)) {
		if (!position?.sign) continue;

		const planetDescription = getPlanetDescription(planet, position.sign);
		if (!planetDescription) continue;

		const houseInfo = position.house ? getHouseInfo(position.house) : null;
		let description = `${planet.charAt(0).toUpperCase() + planet.slice(1)} in ${position.sign}`;

		if (typeof planetDescription === 'object' && 'description' in planetDescription) {
			description += `: ${planetDescription.description}`;
		} else if (typeof planetDescription === 'string') {
			description += `: ${planetDescription}`;
		}

		if (houseInfo) {
			description += ` (residing in the ${houseInfo.name}, ${houseInfo.alias})`;
		}

		planetDescriptions.push(description);
	}

	const houseDescriptions: string[] = [];
	for (const house of chartData.houses) {
		if (!house?.sign) continue;
		const houseInfo = getHouseInfo(house.number);
		if (!houseInfo) continue;

		houseDescriptions.push(
			`${houseInfo.name} (${houseInfo.alias}) in ${house.sign}: ${houseInfo.description}`
		);
	}

	const systemInstruction =
		'You are a wise, mystical astrologer with deep knowledge of the cosmos and the human soul. You speak with poetic grace, profound insight, and a touch of ancient wisdom. Your readings are deeply personal, transformative, and written as if you are channeling the stars themselves. Never include URLs, source lists, citation markers, or bracketed references. Do not claim certainty where interpretation is symbolic. Return only polished narrative text.';

	const userPrompt = `You are preparing a long-form horoscope story for a seeker based on their birth chart.

${chartData.fullName ? `The seeker's name is ${chartData.fullName}.` : 'The seeker has chosen to remain unnamed.'}
They were born on ${chartData.birthDate} at ${chartData.birthTime} in ${chartData.placeName}.
${chartData.lifeTrajectory ? `They describe their life trajectory as: ${chartData.lifeTrajectory}.` : ''}

Core chart data:
${chartData.sunSign ? `- Sun in ${chartData.sunSign}: ${sunSignData?.sun?.description || 'The core identity and life force.'}` : ''}
${chartData.moonSign ? `- Moon in ${chartData.moonSign}: ${moonSignData?.moon?.description || 'The emotional nature and inner world.'}` : ''}
${chartData.ascendant ? `- Ascendant in ${chartData.ascendant}: ${ascendantSignData?.ascendant?.description || 'The outer expression and first impression.'}` : ''}

Keywords:
${chartData.sunSign ? `- Sun keywords: ${sunSignData?.sun?.keywords?.join(', ') || 'N/A'}` : ''}
${chartData.moonSign ? `- Moon keywords: ${moonSignData?.moon?.keywords?.join(', ') || 'N/A'}` : ''}
${chartData.ascendant ? `- Ascendant keywords: ${ascendantSignData?.ascendant?.keywords?.join(', ') || 'N/A'}` : ''}

Planetary council:
${planetDescriptions.length > 0 ? planetDescriptions.map((entry) => `- ${entry}`).join('\n') : '- No planetary positions provided.'}

House activations:
${houseDescriptions.length > 0 ? houseDescriptions.map((entry) => `- ${entry}`).join('\n') : '- No house information provided.'}

Write a mystical, emotionally resonant, and readable story that feels like a premium horoscope reading.

Non-negotiable requirements:
- The story must be centered around the birthplace ${chartData.placeName}.
- Tell a story around the birthtown of the person creating this horoscope story.
- Treat the birthplace as a living influence on identity, memory, temperament, and destiny.
- Do not present the birthplace chapter as a generic travel article. Make it intimate, symbolic, and clearly connected to this seeker's life.
- Synthesize the celestial chart into one coherent narrative instead of listing placements mechanically.
- Keep the tone poetic and grounded, not cheesy.
- Avoid hallucinated citations, footnotes, URLs, and bullet lists in the final answer.
- Keep the output roughly 1500 to 2200 words.

Use exactly this structure and headings:
1. Opening Invocation
2. Chapter I - The Land of First Breath
3. Chapter II - The Celestial Triad
4. Chapter III - Planetary Council and House Activations
5. Chapter IV - Turning Points, Shadows, and Gifts
6. Closing Blessing

Additional guidance for Chapter I - The Land of First Breath:
- Open with the atmosphere and inherited memory of ${chartData.placeName}.
- Imagine the birthtown as the first myth the seeker ever belonged to.
- Connect the spirit of that birthplace to their emotional patterns, self-image, and major life themes.
- If specific historical details are uncertain, stay evocative and symbolic rather than inventing false precision.

Return only the final story text.`;

	return {
		systemInstruction,
		userPrompt
	};
}
