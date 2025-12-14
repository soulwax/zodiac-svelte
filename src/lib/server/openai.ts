import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import generalData from '../../data/general.json';
import planetsData from '../../data/planets.json';

let openai: OpenAI | null = null;

if (env.OPENAI_API_KEY) {
	openai = new OpenAI({
		apiKey: env.OPENAI_API_KEY
	});
}

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
	
	const signData = (planetData as Record<string, unknown>)[signKey];
	return signData || null;
}

function getHouseInfo(houseNumber: number) {
	const houseKey = String(houseNumber);
	return generalData.info.houses[houseKey as keyof typeof generalData.info.houses];
}

export interface AnalysisMetadata {
	analysisText: string;
	fullPrompt: string;
	systemMessage: string;
	model: string;
	temperature: number;
	maxTokens: number;
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
	finishReason?: string;
	responseId?: string;
}

export async function generateMysticalAnalysis(chartData: ChartData): Promise<string> {
	const result = await generateMysticalAnalysisDetailed(chartData);
	return result.analysisText;
}

export async function generateMysticalAnalysisDetailed(chartData: ChartData): Promise<AnalysisMetadata> {
	// Build comprehensive chart information
	const sunSignData = getSignData(chartData.sunSign);
	const moonSignData = getSignData(chartData.moonSign);
	const ascendantSignData = getSignData(chartData.ascendant);

	// Build planet descriptions - include Sun and Moon
	const planetDescriptions: string[] = [];
	
	// Add Sun
	const sunDesc = getSignData(chartData.sunSign);
	if (sunDesc?.sun) {
		planetDescriptions.push(`Sun in ${chartData.sunSign}: ${sunDesc.sun.description}`);
	}
	
	// Add Moon
	const moonDesc = getSignData(chartData.moonSign);
	if (moonDesc?.moon) {
		planetDescriptions.push(`Moon in ${chartData.moonSign}: ${moonDesc.moon.description}`);
	}
	
	// Add all other planets
	for (const [planet, position] of Object.entries(chartData.planets)) {
		const planetDesc = getPlanetDescription(planet, position.sign);
		if (planetDesc) {
			const houseInfo = position.house ? getHouseInfo(position.house) : null;
			let desc = `${planet.charAt(0).toUpperCase() + planet.slice(1)} in ${position.sign}`;
			if (typeof planetDesc === 'object' && 'description' in planetDesc) {
				desc += `: ${planetDesc.description}`;
			} else if (typeof planetDesc === 'string') {
				desc += `: ${planetDesc}`;
			}
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

	if (!openai) {
		throw new Error('OPENAI_API_KEY is not set. Please add it to your .env file.');
	}

	const systemMessage = 'You are a wise, mystical astrologer with deep knowledge of the cosmos and the human soul. You speak with poetic grace, profound insight, and a touch of ancient wisdom. Your readings are deeply personal, transformative, and written as if you are channeling the stars themselves.';
	const model = 'gpt-4o';
	const temperature = 0.8;
	const maxTokens = 2000;

	try {
		const completion = await openai.chat.completions.create({
			model,
			messages: [
				{
					role: 'system',
					content: systemMessage
				},
				{
					role: 'user',
					content: prompt
				}
			],
			temperature,
			max_tokens: maxTokens
		});

		const analysis = completion.choices[0]?.message?.content;
		if (!analysis) {
			throw new Error('No analysis generated from OpenAI');
		}

		// Extract detailed metadata
		const usage = completion.usage;
		const choice = completion.choices[0];

		return {
			analysisText: analysis,
			fullPrompt: prompt,
			systemMessage,
			model,
			temperature,
			maxTokens,
			promptTokens: usage?.prompt_tokens,
			completionTokens: usage?.completion_tokens,
			totalTokens: usage?.total_tokens,
			finishReason: choice?.finish_reason || undefined,
			responseId: completion.id
		};
	} catch (error) {
		console.error('Error generating mystical analysis:', error);
		throw error;
	}
}
