// File: src/lib/server/openai.ts

import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import generalData from '../../data/general.json';
import planetsData from '../../data/planets.json';

let perplexity: OpenAI | null = null;

if (env.PERPLEXITY_API_KEY) {
	perplexity = new OpenAI({
		apiKey: env.PERPLEXITY_API_KEY,
		baseURL: 'https://api.perplexity.ai'
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

function stripCitationMarkers(text: string): string {
	return text
		.replace(/【\d+†[^】]+】/g, '')
		.replace(/\[(?:\d+(?:\s*[-,]\s*\d+)*)\]/g, '')
		.split('\n')
		.map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export async function generateMysticalAnalysis(chartData: ChartData): Promise<string> {
	const result = await generateMysticalAnalysisDetailed(chartData);
	return result.analysisText;
}

export async function generateMysticalAnalysisDetailed(
	chartData: ChartData
): Promise<AnalysisMetadata> {
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
		if (!position || !position.sign) continue;
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
		if (!house || !house.sign) continue;
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
${chartData.sunSign ? `- **Sun in ${chartData.sunSign}**: ${sunSignData?.sun?.description || 'The core identity and life force.'}\n  Keywords: ${sunSignData?.sun?.keywords?.join(', ') || 'N/A'}` : ''}
${chartData.moonSign ? `- **Moon in ${chartData.moonSign}**: ${moonSignData?.moon?.description || 'The emotional nature and inner world.'}\n  Keywords: ${moonSignData?.moon?.keywords?.join(', ') || 'N/A'}` : ''}
${chartData.ascendant ? `- **Ascendant (Rising) in ${chartData.ascendant}**: ${ascendantSignData?.ascendant?.description || 'The mask worn and first impressions.'}\n  Keywords: ${ascendantSignData?.ascendant?.keywords?.join(', ') || 'N/A'}` : ''}

**THE PLANETARY COUNCIL - THE COSMIC INFLUENCES:**
${planetDescriptions.length > 0 ? planetDescriptions.map((desc) => `- ${desc}`).join('\n') : 'No planetary positions provided.'}

**THE TWELVE HOUSES - THE LIFE'S STAGES:**
${houseDescriptions.length > 0 ? houseDescriptions.map((desc) => `- ${desc}`).join('\n') : 'No house information provided.'}

Now, weave together a profound, mystical, and deeply personal analysis. Write as if you are speaking directly to their soul, using poetic and evocative language that captures the magic and mystery of the cosmos. 

Your analysis should:
- Feel like a conversation with an ancient, wise astrologer who sees beyond the veil
- Synthesize all the elements into a cohesive narrative about their soul's journey
- Reveal hidden patterns, strengths, challenges, and potentials
- Speak to the deeper meaning behind the planetary alignments
- Address how the houses activate different areas of their life
- Be mystical yet grounded, profound yet accessible
- Be comprehensive and complete, typically 1500-2500 words in length, ensuring no important aspects are left unexplored
- Use metaphors, imagery, and cosmic language that stirs the soul

Use this chapter structure:
1. Opening Invocation (short, poetic opening)
2. Chapter I - The Land of First Breath (required as the first full chapter):
   - Dedicate this chapter to the birthplace: ${chartData.placeName}
   - Write a vivid historical and cultural origin story of that place and its spirit
   - Connect that place-memory to the seeker's temperament and early soul imprint
3. Chapter II - The Celestial Triad (Sun, Moon, Ascendant synthesis)
4. Chapter III - Planetary Council and House Activations
5. Chapter IV - Turning Points, Shadows, and Gifts
6. Closing Blessing

Formatting requirements:
- Include clear chapter headings exactly in the flow above
- Do not include references, source lists, URLs, or citation markers like [1], [2], or 【1†source】
- Return only clean narrative text

Write this analysis as if you are channeling the wisdom of the stars themselves.`;

	// Check API key at runtime (not just module load)
	// Debug: Log available env keys (without values for security)
	const availableKeys = Object.keys(env)
		.filter((k) => k.includes('API') || k.includes('KEY'))
		.join(', ');
	console.log('Available env keys:', availableKeys || 'none');
	console.log('PERPLEXITY_API_KEY exists:', !!env.PERPLEXITY_API_KEY);
	console.log('PERPLEXITY_API_KEY length:', env.PERPLEXITY_API_KEY?.length || 0);

	if (!env.PERPLEXITY_API_KEY) {
		console.error('PERPLEXITY_API_KEY is not set in environment variables');
		console.error(
			'Make sure PERPLEXITY_API_KEY is in your .env file and restart PM2: pm2 restart stars-ssr-svelte-prod'
		);
		throw new Error(
			'PERPLEXITY_API_KEY is not set. Please add it to your .env file and restart PM2.'
		);
	}

	// Check if API key is empty or just whitespace
	if (env.PERPLEXITY_API_KEY.trim().length === 0) {
		console.error('PERPLEXITY_API_KEY is set but empty');
		throw new Error(
			'PERPLEXITY_API_KEY is set but empty. Please provide a valid API key in your .env file.'
		);
	}

	// Re-initialize Perplexity client if needed (in case env changed or wasn't set at module load)
	if (!perplexity) {
		perplexity = new OpenAI({
			apiKey: env.PERPLEXITY_API_KEY,
			baseURL: 'https://api.perplexity.ai'
		});
	}

	const systemMessage =
		'You are a wise, mystical astrologer with deep knowledge of the cosmos and the human soul. You speak with poetic grace, profound insight, and a touch of ancient wisdom. Your readings are deeply personal, transformative, and written as if you are channeling the stars themselves. Never include bracketed citations, source markers, or URLs in the reading.';
	const model = 'sonar-pro'; // Perplexity model - advanced search model with 200k token context
	const temperature = 0.8;
	const maxTokens = 8000;

	try {
		const completion = await perplexity.chat.completions.create({
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
			throw new Error('No analysis generated from Perplexity');
		}
		const cleanedAnalysis = stripCitationMarkers(analysis);

		// Extract detailed metadata
		const usage = completion.usage;
		const choice = completion.choices[0];

		return {
			analysisText: cleanedAnalysis,
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
		console.error('Error details:', {
			name: error instanceof Error ? error.name : 'Unknown',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});

		// Provide more specific error messages
		if (error instanceof Error) {
			const errorMessage = error.message.toLowerCase();

			// Check for common Perplexity API errors
			if (
				errorMessage.includes('401') ||
				errorMessage.includes('unauthorized') ||
				errorMessage.includes('invalid api key')
			) {
				console.error('Perplexity API authentication failed - invalid API key');
				throw new Error('Invalid PERPLEXITY_API_KEY. Please check your API key in the .env file.');
			}
			if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
				console.error('Perplexity API rate limit exceeded');
				throw new Error('Perplexity API rate limit exceeded. Please try again later.');
			}
			if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
				console.error('Perplexity API server error');
				throw new Error('Perplexity API server error. Please try again later.');
			}
			if (
				errorMessage.includes('network') ||
				errorMessage.includes('fetch') ||
				errorMessage.includes('econnrefused')
			) {
				console.error('Network error connecting to Perplexity API');
				throw new Error(
					'Network error connecting to Perplexity API. Please check your internet connection.'
				);
			}
		}

		// Re-throw with original message if it's already informative
		throw error;
	}
}
