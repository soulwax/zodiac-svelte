// File: src/lib/server/jobs.ts

/**
 * In-memory job tracking for AI analysis on Vercel Hobby plan
 *
 * Note: Jobs are stored in memory and will be lost on cold starts or function restarts.
 * This is acceptable for the Hobby plan which doesn't support KV stores.
 * For production with persistent job tracking, consider upgrading to Pro and using Vercel KV.
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
	id: string;
	status: JobStatus;
	result?: string;
	error?: string;
	createdAt: Date;
	completedAt?: Date;
}

// In-memory job store (lost on cold start)
const jobs = new Map<string, Job>();

// Cleanup jobs older than 1 hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

function cleanupOldJobs() {
	const now = Date.now();
	const oneHourAgo = now - CLEANUP_INTERVAL;

	for (const [jobId, job] of jobs.entries()) {
		if (job.createdAt.getTime() < oneHourAgo) {
			jobs.delete(jobId);
		}
	}
}

// Run cleanup periodically
setInterval(cleanupOldJobs, 15 * 60 * 1000); // Every 15 minutes

export function createJob(id: string): Job {
	const job: Job = {
		id,
		status: 'pending',
		createdAt: new Date()
	};
	jobs.set(id, job);
	return job;
}

export function getJob(id: string): Job | undefined {
	return jobs.get(id);
}

export function updateJob(
	id: string,
	updates: Partial<Omit<Job, 'id' | 'createdAt'>>
): Job | undefined {
	const job = jobs.get(id);
	if (!job) return undefined;

	Object.assign(job, updates);
	if (updates.status === 'completed' || updates.status === 'failed') {
		job.completedAt = new Date();
	}

	jobs.set(id, job);
	return job;
}

export function deleteJob(id: string): boolean {
	return jobs.delete(id);
}
