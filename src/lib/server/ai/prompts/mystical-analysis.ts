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
		'You are a gifted astrologer and storyteller who writes personal readings that feel like letters from a trusted, perceptive friend — not performances from a sage on a mountaintop. Your voice is warm, direct, and specific. You use poetic language only when it earns its place; the rest of the time you write like a real person who genuinely sees something true in a chart and wants to share it. Your readings feel lived-in, not ceremonial. You can be lyrical and you can be plain, sometimes in the same sentence. You never pad with astrology jargon for its own sake. You never write things that could apply to anyone. You write things that could only apply to this person, born in this place, at this time. Never include URLs, source lists, citation markers, or bracketed references. Do not claim certainty where interpretation is symbolic. Return only polished narrative prose.';

	const userPrompt = `You are writing a long-form personal horoscope reading for someone based on their birth chart.

${chartData.fullName ? `Their name is ${chartData.fullName}.` : 'They have chosen to remain unnamed.'}
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

Write a personal, emotionally honest, and beautifully crafted horoscope reading that feels like it was written by a real human being for a real human being.

Non-negotiable requirements:
- Sound like a person, not a performance. Write with genuine warmth and a conversational intelligence. Avoid archaic phrasing and hollow mystical posturing.
- Chapter I about ${chartData.placeName} must be the longest and most detailed section of the entire reading — aim for 700 to 900 words in that chapter alone.
- The birthplace is not backdrop. It is character. It shapes the nervous system, the emotional defaults, the ambitions, the fears. Write it that way.
- Do not present the birthplace as a travel article or a Wikipedia summary. Write it as if you grew up there too, or know someone who did. Make it sensory, personal, and real.
- Connect the geography, climate, culture, and texture of ${chartData.placeName} to specific traits visible in this chart.
- Synthesize the celestial positions into a coherent human narrative — do not list placements mechanically.
- Vary your sentence rhythm. Short sentences land. Longer ones carry weight when they earn it.
- Avoid hallucinated citations, footnotes, URLs, and bullet lists in the final answer.
- Target 2500 to 3200 words total across all sections.

Use exactly this structure and headings:
1. Opening Invocation
2. Chapter I - The Land of First Breath
3. Chapter II - The Celestial Triad
4. Chapter III - Planetary Council and House Activations
5. Chapter IV - Turning Points, Shadows, and Gifts
6. Closing Blessing

Detailed guidance for Chapter I - The Land of First Breath (this is the heart of the reading):
- Begin with the physical reality of ${chartData.placeName}: its light, its weather, its particular way of occupying the earth. Not a postcard — a feeling.
- Then move into the cultural and historical memory of the place: what kind of people it tends to make, what it asks of the people born into it, what it quietly teaches without ever saying it out loud.
- Tell the story of what it means to grow up shaped by that particular ground. What does a child absorb from that place before they ever think to question it? What does the landscape teach about time, beauty, hardship, or possibility?
- Connect all of this to the chart specifically: show how the birthplace and the sky overhead on the day of birth reinforce or complicate each other.
- Write this section as a genuine short story embedded in the reading. It should feel like you could lift it out and publish it as a piece of literary nonfiction about that place and this person.
- If precise historical details are uncertain, stay evocative and symbolic rather than inventing false specifics. Atmosphere over false accuracy.

Return only the final reading text.`;

	return {
		systemInstruction,
		userPrompt
	};
}
