/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.mjs';

/** @type {import("next").NextConfig} */
const config = {
	output: 'standalone',
	// Performance optimizations
	compress: true,
	poweredByHeader: false,
	reactStrictMode: true,
	images: {
		formats: ['image/avif', 'image/webp'],
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
	experimental: {
		// optimizeCss: true, // Temporarily disabled due to CI issues with lightningcss native bindings
		optimizePackageImports: ['@heroicons/react', 'framer-motion'],
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
