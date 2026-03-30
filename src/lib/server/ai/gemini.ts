import { env } from '$env/dynamic/private';
import { ApiError, GoogleGenAI } from '@google/genai';
import { buildMysticalAnalysisPrompt, type ChartData } from './prompts/mystical-analysis';

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

const MODEL_NAME = 'gemini-2.5-flash';
const TEMPERATURE = 0.9;
const MAX_OUTPUT_TOKENS = 8192;

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
	const apiKey = env.GEMINI_API_KEY?.trim();

	if (!apiKey) {
		throw new Error('GEMINI_API_KEY is not set. Please add it to your server environment.');
	}

	if (!geminiClient) {
		geminiClient = new GoogleGenAI({ apiKey });
	}

	return geminiClient;
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

function mapGeminiError(error: unknown): Error {
	if (error instanceof ApiError) {
		if (error.status === 400) {
			return new Error(
				'Gemini rejected the analysis request. Please review the submitted chart data.'
			);
		}

		if (error.status === 401 || error.status === 403) {
			return new Error('Invalid GEMINI_API_KEY. Please check your Gemini API key.');
		}

		if (error.status === 429) {
			return new Error('Gemini rate limit exceeded. Please try again in a moment.');
		}

		if (error.status >= 500) {
			return new Error('Gemini is temporarily unavailable. Please try again later.');
		}
	}

	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		if (message.includes('fetch') || message.includes('network') || message.includes('econn')) {
			return new Error('Network error while contacting Gemini. Please try again.');
		}
	}

	return error instanceof Error ? error : new Error(String(error));
}

export async function generateMysticalAnalysis(chartData: ChartData): Promise<string> {
	const result = await generateMysticalAnalysisDetailed(chartData);
	return result.analysisText;
}

export async function generateMysticalAnalysisDetailed(
	chartData: ChartData
): Promise<AnalysisMetadata> {
	const { systemInstruction, userPrompt } = buildMysticalAnalysisPrompt(chartData);
	const client = getGeminiClient();

	try {
		const response = await client.models.generateContent({
			model: MODEL_NAME,
			contents: userPrompt,
			config: {
				systemInstruction,
				temperature: TEMPERATURE,
				maxOutputTokens: MAX_OUTPUT_TOKENS
			}
		});

		const analysis = response.text;
		if (!analysis) {
			throw new Error('No analysis generated from Gemini.');
		}

		const usage = response.usageMetadata;
		const firstCandidate = response.candidates?.[0];

		return {
			analysisText: stripCitationMarkers(analysis),
			fullPrompt: userPrompt,
			systemMessage: systemInstruction,
			model: MODEL_NAME,
			temperature: TEMPERATURE,
			maxTokens: MAX_OUTPUT_TOKENS,
			promptTokens: usage?.promptTokenCount,
			completionTokens: usage?.candidatesTokenCount,
			totalTokens: usage?.totalTokenCount,
			finishReason: firstCandidate?.finishReason,
			responseId: undefined
		};
	} catch (error) {
		console.error('Error generating mystical analysis with Gemini:', error);
		throw mapGeminiError(error);
	}
}
