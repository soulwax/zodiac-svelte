import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import generalData from '../../data/general.json';
import planetsData from '../../data/planets.json';

if (!env.OPENAI_API_KEY) {
	throw new Error('OPENAI_API_KEY is not set');
}

const openai = new OpenAI({
	apiKey: env.OPENAI_API_KEY
});

interface ChartData {
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

function getSignData(sign: string) {
	const signKey = sign.toLowerCase();
	return generalData.zodiac_signs[signKey as keyof typeof generalData.zodiac_signs] || null;
}

function getPlanetDescription(planet: string, sign: string) {
	const signKey = sign.toLowerCase();
	const planetData = planetsData.planetary_sign_details[planet as keyof typeof planetsData.planetary_sign_details];
	if (!planetData || typeof planetData !== 'object') return null;
	
	const signData = (planetData as Record<string, any>)[signKey];
	return signData || null;
}

function getHouseInfo(houseNumber: number) {
	const houseKey = String(houseNumber);
	return generalData.info.houses[houseKey as keyof typeof generalData.info.houses];
}

export async function generateMysticalAnalysis(chartData: ChartData): Promise<string> {
	// Build comprehensive chart information
	const sunSignData = getSignData(chartData.sunSign);
	const moonSignData = getSignData(chartData.moonSign);
	const ascendantSignData = getSignData(chartData.ascendant);

	// Build planet descriptions
	const planetDescriptions: string[] = [];
	for (const [planet, position] of Object.entries(chartData.planets)) {
		const planetDesc = getPlanetDescription(planet, position.sign);
		if (planetDesc) {
			const houseInfo = position.house ? getHouseInfo(position.house) : null;
			let desc = `${planet.charAt(0).toUpperCase() + planet.slice(1)} in ${position.sign}: ${planetDesc.description}`;
			if (houseInfo) {
				desc += ` (residing in the ${houseInfo.name}, ${houseInfo.alias})`;
			}
			planetDescriptions.push(desc);
		}
	}

	// Build house information
	const houseDescriptions: string[] = [];
	for (const house of chartData.houses) {
		const houseInfo = getHouseInfo(house.number);
		if (houseInfo) {
			houseDescriptions.push(
				`${houseInfo.name} (${houseInfo.alias}) in ${house.sign}: ${houseInfo.description}`
			);
		}
	}

	// Craft the mystical prompt
	const prompt = `You are a wise and mystical astrologer, gifted with the ability to read the cosmic patterns written in the stars. A seeker has come to you with their birth chart, and they yearn for a profound, soul-deep understanding of their celestial blueprint.

${chartData.fullName ? `The seeker's name is ${chartData.fullName}.` : 'The seeker has chosen to remain unnamed.'}
They were born on ${chartData.birthDate} at ${chartData.birthTime} in ${chartData.placeName}.
${chartData.lifeTrajectory ? `They describe their life trajectory as: ${chartData.lifeTrajectory}.` : ''}

**THE CELESTIAL TRIAD - THE SOUL'S ESSENCE:**
- **Sun in ${chartData.sunSign}**: ${sunSignData?.sun?.description || 'The core identity and life force.'}
  Keywords: ${sunSignData?.sun?.keywords?.join(', ') || 'N/A'}

- **Moon in ${chartData.moonSign}**: ${moonSignData?.moon?.description || 'The emotional nature and inner world.'}
  Keywords: ${moonSignData?.moon?.keywords?.join(', ') || 'N/A'}

- **Ascendant (Rising) in ${chartData.ascendant}**: ${ascendantSignData?.ascendant?.description || 'The mask worn and first impressions.'}
  Keywords: ${ascendantSignData?.ascendant?.keywords?.join(', ') || 'N/A'}

**THE PLANETARY COUNCIL - THE COSMIC INFLUENCES:**
${planetDescriptions.length > 0 ? planetDescriptions.map(desc => `- ${desc}`).join('\n') : 'No planetary positions provided.'}

**THE TWELVE HOUSES - THE LIFE'S STAGES:**
${houseDescriptions.length > 0 ? houseDescriptions.map(desc => `- ${desc}`).join('\n') : 'No house information provided.'}

Now, weave together a profound, mystical, and deeply personal analysis. Write as if you are speaking directly to their soul, using poetic and evocative language that captures the magic and mystery of the cosmos. 

Your analysis should:
- Feel like a conversation with an ancient, wise astrologer who sees beyond the veil
- Synthesize all the elements into a cohesive narrative about their soul's journey
- Reveal hidden patterns, strengths, challenges, and potentials
- Speak to the deeper meaning behind the planetary alignments
- Address how the houses activate different areas of their life
- Be mystical yet grounded, profound yet accessible
- Be approximately 800-1200 words in length
- Use metaphors, imagery, and cosmic language that stirs the soul

Begin with an opening that acknowledges the sacred moment of their birth, then guide them through the mysteries revealed in their chart. End with a blessing or cosmic insight that offers hope and direction.

Write this analysis as if you are channeling the wisdom of the stars themselves.`;

	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o',
			messages: [
				{
					role: 'system',
					content: 'You are a wise, mystical astrologer with deep knowledge of the cosmos and the human soul. You speak with poetic grace, profound insight, and a touch of ancient wisdom. Your readings are deeply personal, transformative, and written as if you are channeling the stars themselves.'
				},
				{
					role: 'user',
					content: prompt
				}
			],
			temperature: 0.8,
			max_tokens: 2000
		});

		const analysis = completion.choices[0]?.message?.content;
		if (!analysis) {
			throw new Error('No analysis generated from OpenAI');
		}

		return analysis;
	} catch (error) {
		console.error('Error generating mystical analysis:', error);
		throw error;
	}
}
