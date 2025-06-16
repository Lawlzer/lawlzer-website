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
	output: 'standalone',
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
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'x-subdomain-handled',
						value: 'true',
					},
					// Security headers
					{
						key: 'X-DNS-Prefetch-Control',
						value: 'on',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-Frame-Options',
						value: 'SAMEORIGIN',
					},
					{
						key: 'X-XSS-Protection',
						value: '1; mode=block',
					},
					{
						key: 'Referrer-Policy',
						value: 'origin-when-cross-origin',
					},
				],
			},
			// Cache static assets
			{
				source: '/:path*.{jpg,jpeg,png,gif,webp,svg,ico}',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
			{
				source: '/_next/static/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
		];
	},
	allowedDevOrigins: ['localhost', 'valorant.localhost', 'valorant.localhost.com', 'dev.localhost', 'valorant.dev.localhost', 'colors.dev.localhost'],
};

export default config;
