import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = 'https://todo.fixme.com';

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
		{
			url: 'https://valorant.todo.fixme.com',
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
		{
			url: 'https://colors.todo.fixme.com',
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.2,
		},
	];
}
