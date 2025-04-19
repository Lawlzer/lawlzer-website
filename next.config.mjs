/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.mjs';

/** @type {import("next").NextConfig} */
const config = {
	async rewrites() {
		return [
			{
				source: '/valorant',
				destination: '/subdomains/valorant',
			},
			{
				source: '/valorant/:path*',
				destination: '/subdomains/valorant/:path*',
			},
		];
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'x-subdomain-handled',
						value: 'true',
					},
				],
			},
		];
	},
	allowedDevOrigins: ['localhost', 'valorant.localhost', 'valorant.localhost.com', 'dev.localhost', 'valorant.dev.localhost', 'colors.localhost'],
};

export default config;
