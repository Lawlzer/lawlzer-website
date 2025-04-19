import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('postcss-load-config').Config} */
const config = {
	plugins: {
		'@tailwindcss/postcss': {
			// Add Tailwind config directly here for v4
			plugins: [tailwindcssAnimate],
		},
		autoprefixer: {},
	},
};

export default config;
