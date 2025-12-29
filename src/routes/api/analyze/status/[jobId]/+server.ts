import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getJob } from '$lib/server/jobs';

export const GET: RequestHandler = async ({ params }) => {
	const { jobId } = params;

	if (!jobId) {
		return json({ success: false, error: 'Job ID is required' }, { status: 400 });
	}

	const job = getJob(jobId);

	if (!job) {
		return json({ success: false, error: 'Job not found' }, { status: 404 });
	}

	return json({
		success: true,
		status: job.status,
		result: job.result,
		error: job.error
	});
};
