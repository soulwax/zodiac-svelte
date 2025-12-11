<script lang="ts">
	import { page } from '$app/stores';
	
	const siteUrl = $derived($page.url.origin);
	const pageUrl = $derived($page.url.href);
</script>

<svelte:head>
	<title>About - Zodiac Chart Calculator | Soulwax</title>
	<meta name="description" content="Learn about the creator of this zodiac chart calculator. A passion project combining technology, astronomy, and astrology by soulwax/starchild from Germany." />
	<meta name="keywords" content="about, zodiac calculator, astrology, soulwax, starchild, birth chart" />
	<meta name="author" content="Soulwax" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:title" content="About - Zodiac Chart Calculator" />
	<meta property="og:description" content="Learn about the creator of this zodiac chart calculator. A passion project combining technology, astronomy, and astrology." />
	<meta property="og:image" content={`${siteUrl}/favicon.png`} />
	<meta property="og:site_name" content="Zodiac Chart Calculator" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:url" content={pageUrl} />
	<meta name="twitter:title" content="About - Zodiac Chart Calculator" />
	<meta name="twitter:description" content="Learn about the creator of this zodiac chart calculator." />
	<meta name="twitter:image" content={`${siteUrl}/favicon.png`} />
	
	<!-- Additional SEO -->
	<link rel="canonical" href={pageUrl} />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="text-column">
	<h1>About</h1>

	<section>
		<h2>Welcome</h2>
		<p>
			Hello! I'm a private person from Germany, known online as soulwax/starchild. This zodiac website represents a passion project that combines my interests in technology, astronomy, and the awe of existence.
		</p>
	</section>

	<section>
		<h2>Professional Life</h2>
		<p>
			By profession, I'm an entrepreneur working in the cybersecurity and consulting business. I've spent years helping organizations navigate topics like digital security, privacy, and compliance, providing strategic guidance and practical solutions to protect against evolving threats. My work involves everything from risk assessment and security architecture to incident response and compliance consulting.
		</p>
		<p>
			The cybersecurity field has taught me to think critically, anticipate problems before they arise, and appreciate the systems that drive the digital landscape of today and tomorrow. These skills have proven surprisingly useful in my programming journey, where understanding system architecture and potential vulnerabilities is just as important.
		</p>
	</section>

	<section>
		<h2>Personal Life</h2>
		<p>
			I'm a proud father to a wonderful little girl who brings endless joy and perspective to my life. Being a parent has reshaped how I view the world and has given me a deeper appreciation for creating things that matter—whether that's building secure systems for clients or crafting digital experiences like this website.
		</p>
		<p>
			I live near Herford, Germany, a charming town in North Rhine-Westphalia. The region's rich history and beautiful landscapes provide a peaceful backdrop for both my professional work and personal projects. When I'm not working or coding, I enjoy exploring the local area with my daughter and appreciating the slower pace of life outside the major tech hubs.
		</p>
	</section>

	<section>
		<h2>Educational Background</h2>
		<p>
			My academic journey took an interesting path. I studied and learned Neurology as well as Psychiatry. This has gifted me with a deep understanding of the human brain, neural pathways, and the complex systems that govern our thoughts and behaviors. Neurological patterns echo in the digital world and the digital systems I work with today.
		</p>
		<p>
			I never formally studied computer science. Programming and web development are entirely self-taught hobbies that I've pursued out of curiosity and passion. This path has been both challenging and rewarding. Without the structured curriculum of a CS degree, I've had to learn by doing, experimenting, and sometimes making mistakes but that hands-on approach has given me a unique perspective on problem-solving.
		</p>
	</section>

	<section>
		<h2>Philosophy & Interests</h2>
		<p>
			I believe in taking care of myself and a balanced diet and rigorous exercise routine. In the morning if my face is a little puffy I'll put on an ice pack while doing stomach crunches. I can do 1000 now. After I remove the ice pack I use a deep pore cleanser lotion. In the shower I use a water activated gel cleanser, then a honey almond body scrub, and on the face an exfoliating gel scrub. Then I apply an herb-mint facial mask which I leave on for 10 minutes while I prepare the rest of my routine. I always use an after shave lotion with little or no alcohol, because alcohol dries your face out and makes you look older. Then moisturizer, then an anti-aging eye balm followed by a final moisturizing protective lotion.
		</p>
		<p>
			There is an idea of a Patrick Bateman, some kind of abstraction, but there is no real me. Only an entity, something illusory. And though I can hide my cold gaze, and you can shake my hand and feel flesh gripping yours and maybe you can even sense our lifestyles are probably comparable, I simply am not there.
		</p>
	</section>
</div>

<style>
	section {
		margin-bottom: 2rem;
	}

	section h2 {
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: var(--color-theme-2);
	}

	section p {
		margin-bottom: 1rem;
		line-height: 1.6;
	}
</style>
