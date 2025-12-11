import { db } from '$lib/server/db';
import { sverdleResults } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { Game } from './game.ts';

export const load = (({ cookies }) => {
	const game = new Game(cookies.get('sverdle'));

	return {
		/**
		 * The player's guessed words so far
		 */
		guesses: game.guesses,

		/**
		 * An array of strings like '__x_c' corresponding to the guesses, where 'x' means
		 * an exact match, and 'c' means a close match (right letter, wrong place)
		 */
		answers: game.answers,

		/**
		 * The correct answer, revealed if the game is over
		 */
		answer: game.answers.length >= 6 ? game.answer : null
	};
}) satisfies PageServerLoad;

export const actions = {
	/**
	 * Modify game state in reaction to a keypress. If client-side JavaScript
	 * is available, this will happen in the browser instead of here
	 */
	update: async ({ request, cookies }) => {
		const game = new Game(cookies.get('sverdle'));

		const data = await request.formData();
		const key = data.get('key');

		const i = game.answers.length;

		if (key === 'backspace') {
			game.guesses[i] = game.guesses[i].slice(0, -1);
		} else {
			game.guesses[i] += key;
		}

		cookies.set('sverdle', game.toString(), { path: '/' });
	},

	/**
	 * Modify game state in reaction to a guessed word. This logic always runs on
	 * the server, so that people can't cheat by peeking at the JavaScript
	 */
	enter: async ({ request, cookies }) => {
		const game = new Game(cookies.get('sverdle'));

		const data = await request.formData();
		const guess = data.getAll('guess') as string[];

		if (!game.enter(guess)) {
			return fail(400, { badGuess: true });
		}

		cookies.set('sverdle', game.toString(), { path: '/' });

		// Check if game is complete and save result
		const isComplete = game.answers.length >= 6 || game.answers[game.answers.length - 1] === 'xxxxx';
		if (isComplete) {
			try {
				// Get session ID from cookies (or generate one)
				const sessionId = cookies.get('sessionId') || crypto.randomUUID();
				if (!cookies.get('sessionId')) {
					cookies.set('sessionId', sessionId, { path: '/' });
				}

				// Filter out empty guesses
				const completedGuesses = game.guesses.filter((g) => g.trim() !== '');
				const won = game.answers[game.answers.length - 1] === 'xxxxx';

				await db.insert(sverdleResults).values({
					wordIndex: game.index,
					answer: game.answer,
					guesses: completedGuesses,
					answers: game.answers,
					won,
					attempts: completedGuesses.length,
					completedAt: new Date(),
					sessionId
				});
			} catch (error) {
				// Don't fail the game if saving fails
				console.error('Error saving sverdle result:', error);
			}
		}
	},

	restart: async ({ cookies }) => {
		cookies.delete('sverdle', { path: '/' });
	}
} satisfies Actions;
