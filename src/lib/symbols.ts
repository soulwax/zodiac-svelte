// File: src/lib/symbols.ts

import type { ZodiacSign } from './zodiac';

/**
 * Zodiac sign symbols (Unicode astrological symbols)
 */
export const zodiacSymbols: Record<ZodiacSign, string> = {
	Aries: '♈',
	Taurus: '♉',
	Gemini: '♊',
	Cancer: '♋',
	Leo: '♌',
	Virgo: '♍',
	Libra: '♎',
	Scorpio: '♏',
	Sagittarius: '♐',
	Capricorn: '♑',
	Aquarius: '♒',
	Pisces: '♓'
};

/**
 * Planetary symbols (Unicode astrological symbols)
 */
export enum Planet {
	Sun = 'Sun',
	Moon = 'Moon',
	Mercury = 'Mercury',
	Venus = 'Venus',
	Mars = 'Mars',
	Jupiter = 'Jupiter',
	Saturn = 'Saturn',
	Uranus = 'Uranus',
	Neptune = 'Neptune',
	Pluto = 'Pluto'
}

export const planetarySymbols: Record<Planet, string> = {
	[Planet.Sun]: '☉',
	[Planet.Moon]: '☽',
	[Planet.Mercury]: '☿',
	[Planet.Venus]: '♀',
	[Planet.Mars]: '♂',
	[Planet.Jupiter]: '♃',
	[Planet.Saturn]: '♄',
	[Planet.Uranus]: '⛢',
	[Planet.Neptune]: '♆',
	[Planet.Pluto]: '♇'
};

/**
 * Other astrological symbols
 */
export const astrologicalSymbols = {
	Ascendant: 'ASC',
	Midheaven: 'MC',
	Descendant: 'DSC',
	IC: 'IC',
	NorthNode: '☊',
	SouthNode: '☋',
	PartOfFortune: '⊕',
	Chiron: '⚷'
} as const;

/**
 * Get zodiac symbol for a sign
 */
export function getZodiacSymbol(sign: ZodiacSign): string {
	return zodiacSymbols[sign];
}

/**
 * Get planetary symbol for a planet
 */
export function getPlanetarySymbol(planet: Planet): string {
	return planetarySymbols[planet];
}

/**
 * Get all zodiac symbols as an array
 */
export function getAllZodiacSymbols(): Array<{ sign: ZodiacSign; symbol: string }> {
	return Object.entries(zodiacSymbols).map(([sign, symbol]) => ({
		sign: sign as ZodiacSign,
		symbol
	}));
}

/**
 * Get all planetary symbols as an array
 */
export function getAllPlanetarySymbols(): Array<{ planet: Planet; symbol: string }> {
	return Object.entries(planetarySymbols).map(([planet, symbol]) => ({
		planet: planet as Planet,
		symbol
	}));
}
