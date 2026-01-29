// File: src/routes/zodiac/+page.ts

import type { PageLoadEvent } from './$types';

export const load = async ({ url }: PageLoadEvent) => {
	const siteUrl = url.origin;
	const pageUrl = url.href;
	
	return {
		seo: {
			title: 'Zodiac Chart Calculator - Free Birth Chart Analysis',
			description: 'Calculate your complete zodiac birth chart with detailed astrological analysis. Discover your sun sign, moon sign, ascendant, planetary positions, and house placements. Free and accurate astrological chart calculator.',
			keywords: 'zodiac chart, birth chart, astrology calculator, sun sign, moon sign, ascendant, natal chart, astrological chart, horoscope, planetary positions',
			url: pageUrl,
			siteUrl: siteUrl,
			image: `${siteUrl}/favicon.png`,
			type: 'website',
			author: 'Soulwax'
		}
	};
};
