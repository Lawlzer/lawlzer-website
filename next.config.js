/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.js';

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
};

export default config;
