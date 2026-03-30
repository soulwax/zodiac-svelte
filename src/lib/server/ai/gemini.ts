import { env } from '$env/dynamic/private';
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

interface GeminiGenerateContentResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{
				text?: string;
			}>;
		};
		finishReason?: string;
	}>;
	usageMetadata?: {
		promptTokenCount?: number;
		candidatesTokenCount?: number;
		totalTokenCount?: number;
	};
	error?: {
		code?: number;
		message?: string;
		status?: string;
	};
}

const MODEL_NAME = 'gemini-3-flash-preview';
const TEMPERATURE = 0.9;
const MAX_OUTPUT_TOKENS = 4096;
const GEMINI_GENERATE_CONTENT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

function getGeminiApiKey(): string {
	const apiKey = env.GEMINI_API_KEY?.trim();

	if (!apiKey) {
		throw new Error('GEMINI_API_KEY is not set. Please add it to your server environment.');
	}

	return apiKey;
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

function extractText(response: GeminiGenerateContentResponse): string | null {
	const parts = response.candidates?.[0]?.content?.parts ?? [];
	const text = parts
		.map((part) => part.text?.trim())
		.filter((value): value is string => Boolean(value))
		.join('\n\n')
		.trim();

	return text || null;
}

function mapGeminiHttpError(status: number, message: string): Error {
	if (status === 400) {
		return new Error(
			'Gemini rejected the analysis request. Please review the submitted chart data.'
		);
	}

	if (status === 401 || status === 403) {
		return new Error('Invalid GEMINI_API_KEY. Please check your Gemini API key.');
	}

	if (status === 429) {
		return new Error('Gemini rate limit exceeded. Please try again in a moment.');
	}

	if (status >= 500) {
		return new Error('Gemini is temporarily unavailable. Please try again later.');
	}

	return new Error(message || 'Gemini request failed.');
}

function mapGeminiError(error: unknown): Error {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		if (message.includes('fetch') || message.includes('network') || message.includes('econn')) {
			return new Error('Network error while contacting Gemini. Please try again.');
		}

		return error;
	}

	return new Error(String(error));
}

export async function generateMysticalAnalysis(chartData: ChartData): Promise<string> {
	const result = await generateMysticalAnalysisDetailed(chartData);
	return result.analysisText;
}

export async function generateMysticalAnalysisDetailed(
	chartData: ChartData
): Promise<AnalysisMetadata> {
	const { systemInstruction, userPrompt } = buildMysticalAnalysisPrompt(chartData);
	const apiKey = getGeminiApiKey();

	try {
		const response = await fetch(GEMINI_GENERATE_CONTENT_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-goog-api-key': apiKey
			},
			body: JSON.stringify({
				system_instruction: {
					parts: [{ text: systemInstruction }]
				},
				contents: [
					{
						role: 'user',
						parts: [{ text: userPrompt }]
					}
				],
				generationConfig: {
					temperature: TEMPERATURE,
					maxOutputTokens: MAX_OUTPUT_TOKENS,
					responseMimeType: 'text/plain'
				}
			})
		});

		const payload = (await response.json()) as GeminiGenerateContentResponse;

		if (!response.ok) {
			throw mapGeminiHttpError(
				response.status,
				payload.error?.message || `Gemini request failed with status ${response.status}.`
			);
		}

		const analysis = extractText(payload);
		if (!analysis) {
			throw new Error('No analysis generated from Gemini.');
		}

		return {
			analysisText: stripCitationMarkers(analysis),
			fullPrompt: userPrompt,
			systemMessage: systemInstruction,
			model: MODEL_NAME,
			temperature: TEMPERATURE,
			maxTokens: MAX_OUTPUT_TOKENS,
			promptTokens: payload.usageMetadata?.promptTokenCount,
			completionTokens: payload.usageMetadata?.candidatesTokenCount,
			totalTokens: payload.usageMetadata?.totalTokenCount,
			finishReason: payload.candidates?.[0]?.finishReason,
			responseId: undefined
		};
	} catch (error) {
		console.error('Error generating mystical analysis with Gemini:', error);
		throw mapGeminiError(error);
	}
}
