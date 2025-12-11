<script lang="ts">
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Zodiac Calculator - Discover your sun sign" />
</svelte:head>

<section>
	<h1>Zodiac Calculator</h1>
	<h2>Discover your sun sign based on your birth details</h2>
	<a href="/zodiac" class="cta-button">Calculate Your Sun Sign</a>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
		text-align: center;
	}

	h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
		color: var(--color-text);
	}

	h2 {
		font-size: 1.25rem;
		color: var(--color-text-muted);
		margin-bottom: 2rem;
		font-weight: 400;
	}

	.cta-button {
		display: inline-block;
		padding: 1rem 2rem;
		background: var(--color-theme-1);
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-size: 1.1rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.cta-button:hover {
		background: var(--color-theme-2);
		text-decoration: none;
	}
</style>
