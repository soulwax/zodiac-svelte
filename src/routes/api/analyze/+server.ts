// File: src/routes/api/analyze/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createJob, updateJob } from '$lib/server/jobs';
import { generateMysticalAnalysisDetailed } from '$lib/server/openai';
import { db } from '$lib/server/db';
import { analysisRecords, zodiacResults } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const data = await request.json();

		// Validate required chart data
		if (!data.sunSign || !data.moonSign || !data.ascendant) {
			return json(
				{
					success: false,
					error:
						'Missing required chart data. Please ensure sun sign, moon sign, and ascendant are provided.'
				},
				{ status: 400 }
			);
		}

		// Generate unique job ID
		const jobId = crypto.randomUUID();

		// Create job in pending state
		createJob(jobId);

		// Start async analysis (fire and forget)
		processAnalysisAsync(jobId, data, cookies).catch((error) => {
			console.error('Error in async analysis:', error);
			updateJob(jobId, {
				status: 'failed',
				error: error instanceof Error ? error.message : String(error)
			});
		});

		// Return job ID immediately
		return json({ success: true, jobId });
	} catch (error) {
		console.error('Error creating analysis job:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create analysis job'
			},
			{ status: 500 }
		);
	}
};

async function processAnalysisAsync(jobId: string, chartData: any, cookies: any) {
	try {
		// Update status to processing
		updateJob(jobId, { status: 'processing' });

		// Generate detailed mystical analysis with metadata
		const analysisMetadata = await generateMysticalAnalysisDetailed(chartData);
		const analysis = analysisMetadata.analysisText;

		// Determine the zodiac result ID
		let finalResultId: number | null = null;

		if (chartData.resultId) {
			finalResultId = parseInt(chartData.resultId);
			// Update existing record's aiAnalysis field (for backward compatibility)
			await db
				.update(zodiacResults)
				.set({ aiAnalysis: analysis })
				.where(eq(zodiacResults.id, finalResultId));
		} else {
			// Get session ID from cookies
			const sessionId = cookies.get('sessionId');
			if (sessionId) {
				// Try to find the most recent record for this session
				const recentResult = await db
					.select()
					.from(zodiacResults)
					.where(eq(zodiacResults.sessionId, sessionId))
					.orderBy(desc(zodiacResults.createdAt))
					.limit(1);

				if (recentResult.length > 0) {
					finalResultId = recentResult[0].id;
					// Update existing record's aiAnalysis field (for backward compatibility)
					await db
						.update(zodiacResults)
						.set({ aiAnalysis: analysis })
						.where(eq(zodiacResults.id, finalResultId));
				}
			}
		}

		// Save detailed analysis record if we have a result ID
		if (finalResultId) {
			const sessionId = cookies.get('sessionId') || null;

			await db.insert(analysisRecords).values({
				zodiacResultId: finalResultId,
				analysisText: analysisMetadata.analysisText,
				fullPrompt: analysisMetadata.fullPrompt,
				systemMessage: analysisMetadata.systemMessage,
				model: analysisMetadata.model,
				temperature: analysisMetadata.temperature,
				maxTokens: analysisMetadata.maxTokens,
				promptTokens: analysisMetadata.promptTokens || null,
				completionTokens: analysisMetadata.completionTokens || null,
				totalTokens: analysisMetadata.totalTokens || null,
				finishReason: analysisMetadata.finishReason || null,
				responseId: analysisMetadata.responseId || null,
				chartDataSnapshot: {
					fullName: chartData.fullName,
					lifeTrajectory: chartData.lifeTrajectory,
					birthDate: chartData.birthDate,
					birthTime: chartData.birthTime,
					placeName: chartData.placeName,
					sunSign: chartData.sunSign,
					ascendant: chartData.ascendant,
					moonSign: chartData.moonSign,
					planets: chartData.planets,
					houses: chartData.houses
				},
				analysisType: 'mystical',
				analysisVersion: '1.0',
				completedAt: new Date(),
				sessionId
			});
		}

		// Update job with completed status
		updateJob(jobId, {
			status: 'completed',
			result: analysis
		});
	} catch (error) {
		console.error('Error processing analysis:', error);
		updateJob(jobId, {
			status: 'failed',
			error: error instanceof Error ? error.message : String(error)
		});
	}
}
