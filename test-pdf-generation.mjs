import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import dotenv from 'dotenv';
import { jsPDF } from 'jspdf';
import { buildMysticalAnalysisPrompt } from './src/lib/server/ai/prompts/mystical-analysis.ts';

dotenv.config({ path: '.env.local', override: true });
dotenv.config({ override: true });

const outputDir = path.resolve('tmp');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(outputDir, `pdf-generation-${timestamp}.pdf`);
const model = 'gemini-2.5-flash';
const temperature = 0.9;
const maxOutputTokens = 4096;
const fallbackAnalysis = `Opening Invocation

You arrived beneath a restless morning sky, carrying the bright curiosity of Gemini, the poised inner weather of Libra, and the warm entrance of Leo. This reading stands in for the live AI response when the Gemini key is unavailable, but it still exercises the PDF generation path with realistic narrative content.

Chapter I - The Land of First Breath

Berlin is not a quiet birthplace. It is a city of crossings, recoveries, reinventions, and unfinished conversations. To begin life there is to inherit a rhythm shaped by contrast: severity beside beauty, memory beside invention, fracture beside possibility. In your chart, that first atmosphere reads like an initiation into complexity. You were not meant for a flat life. You were meant for a life that asks questions, rebuilds identity, and notices the hidden architecture beneath the visible world.

Chapter II - The Celestial Triad

Gemini gives your solar center movement, language, and the need to explore more than one truth at a time. Libra in the Moon seeks harmony, proportion, and emotional intelligence. Leo rising lends presence, style, and a theatrical honesty in first impressions. Together they describe someone who can translate feeling into language and language into connection.

Chapter III - Planetary Council and House Activations

Your supporting placements add initiative, devotion, and strategic patience. The chart suggests a person who learns through contrast: private reflection feeding public clarity, tenderness strengthening ambition, and discipline shaping creativity into something durable.

Chapter IV - Turning Points, Shadows, and Gifts

Your turning points arrive when curiosity outruns fear. Your shadow appears when overthinking replaces trust. Your gift is synthesis: you can hold multiple perspectives without losing your center. When you remember that, the chart opens rather than tightens.

Closing Blessing

May the city of your first breath continue to remind you that renewal is real. May your voice stay agile, your heart balanced, and your presence generous. May every future reinvention bring you closer to the shape of life that has been waiting for you all along.`;

const chartData = {
	fullName: 'PDF Test Seeker',
	lifeTrajectory: 'up',
	birthDate: '1990-06-15',
	birthTime: '08:45',
	placeName: 'Berlin, Germany',
	sunSign: 'Gemini',
	moonSign: 'Libra',
	ascendant: 'Leo',
	planets: {
		sun: { sign: 'Gemini' },
		moon: { sign: 'Libra' },
		mercury: { sign: 'Cancer', house: 12 },
		venus: { sign: 'Taurus', house: 10 },
		mars: { sign: 'Aries', house: 9 },
		jupiter: { sign: 'Cancer', house: 12 },
		saturn: { sign: 'Capricorn', house: 6 }
	},
	houses: [
		{ number: 1, sign: 'Leo' },
		{ number: 2, sign: 'Virgo' },
		{ number: 3, sign: 'Libra' },
		{ number: 4, sign: 'Scorpio' },
		{ number: 5, sign: 'Sagittarius' },
		{ number: 6, sign: 'Capricorn' },
		{ number: 7, sign: 'Aquarius' },
		{ number: 8, sign: 'Pisces' },
		{ number: 9, sign: 'Aries' },
		{ number: 10, sign: 'Taurus' },
		{ number: 11, sign: 'Gemini' },
		{ number: 12, sign: 'Cancer' }
	]
};

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
	const lines = doc.splitTextToSize(text, maxWidth);
	let cursorY = y;

	for (const line of lines) {
		if (cursorY > 270) {
			doc.addPage();
			cursorY = 20;
		}

		doc.text(line, x, cursorY);
		cursorY += lineHeight;
	}

	return cursorY;
}

async function main() {
	await fs.mkdir(outputDir, { recursive: true });

	let analysisText = fallbackAnalysis;
	let promptTokens = null;
	let completionTokens = null;
	let mode = 'fallback';
	let warning = null;

	if (process.env.GEMINI_API_KEY) {
		try {
			const { systemInstruction, userPrompt } = buildMysticalAnalysisPrompt(chartData);
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
				{
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						'x-goog-api-key': process.env.GEMINI_API_KEY
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
							temperature,
							maxOutputTokens,
							responseMimeType: 'text/plain'
						}
					})
				}
			);

			const payload = await response.json();
			if (!response.ok) {
				throw new Error(
					payload?.error?.message || `Gemini request failed with status ${response.status}`
				);
			}

			const liveAnalysis =
				payload?.candidates?.[0]?.content?.parts
					?.map((part) => part?.text?.trim())
					.filter(Boolean)
					.join('\n\n')
					.trim() || '';

			if (!liveAnalysis) {
				throw new Error('Gemini returned no analysis text for the PDF test.');
			}

			analysisText = liveAnalysis;
			promptTokens = payload?.usageMetadata?.promptTokenCount ?? null;
			completionTokens = payload?.usageMetadata?.candidatesTokenCount ?? null;
			mode = 'live';
		} catch (error) {
			warning = error instanceof Error ? error.message : String(error);
		}
	} else {
		warning = 'GEMINI_API_KEY is not set; using fallback analysis text.';
	}

	const doc = new jsPDF();
	const margin = 20;
	const maxWidth = 170;
	let y = 20;

	doc.setFont('times', 'bold');
	doc.setFontSize(20);
	doc.text('Zodiac Analysis PDF Test', margin, y);
	y += 12;

	doc.setFont('times', 'normal');
	doc.setFontSize(11);
	doc.text(`Name: ${chartData.fullName}`, margin, y);
	y += 7;
	doc.text(`Birth: ${chartData.birthDate} ${chartData.birthTime}`, margin, y);
	y += 7;
	doc.text(`Birthplace: ${chartData.placeName}`, margin, y);
	y += 10;

	doc.setFont('times', 'bold');
	doc.text('Core Signs', margin, y);
	y += 8;

	doc.setFont('times', 'normal');
	doc.text(`Sun: ${chartData.sunSign}`, margin, y);
	y += 6;
	doc.text(`Moon: ${chartData.moonSign}`, margin, y);
	y += 6;
	doc.text(`Ascendant: ${chartData.ascendant}`, margin, y);
	y += 10;

	doc.setFont('times', 'bold');
	doc.text('AI Analysis', margin, y);
	y += 8;

	doc.setFont('times', 'normal');
	y = addWrappedText(doc, analysisText, margin, y, maxWidth, 6);

	const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
	await fs.writeFile(outputPath, pdfBuffer);

	const stats = await fs.stat(outputPath);
	if (stats.size === 0) {
		throw new Error(`PDF file was created but is empty: ${outputPath}`);
	}

	console.log(
		JSON.stringify(
			{
				success: true,
				outputPath,
				size: stats.size,
				model,
				mode,
				promptTokens,
				completionTokens,
				warning
			},
			null,
			2
		)
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
