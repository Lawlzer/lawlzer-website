/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.mjs';

import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
	webpack: (config) => {
		config.resolve.alias = {
			...config.resolve.alias,
			'~': resolve(__dirname, 'src'),
			'@': resolve(__dirname, 'src'),
			src: resolve(__dirname, 'src'),
			'@testUtils': resolve(__dirname, 'testUtils'),
		};
		return config;
	},
	// Performance optimizations
	compress: true,
	poweredByHeader: false,
	reactStrictMode: true,
	images: {
		formats: ['image/avif', 'image/webp'],
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
		// Image optimization is now working on Vercel
		minimumCacheTTL: 60,
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},
	experimental: {
		optimizeCss: true,
		optimizePackageImports: ['@heroicons/react', 'framer-motion', '@headlessui/react', '@visx/visx'],
		scrollRestoration: true,
		webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB'],
	},
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
	allowedDevOrigins: ['localhost', 'valorant.localhost', 'valorant.localhost.com', 'dev.localhost', 'valorant.dev.localhost', 'colors.dev.localhost'],
};

export default config;
