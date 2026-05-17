import type { MetadataRoute } from 'next';

import { getBaseUrl } from '~/lib/utils';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = getBaseUrl();

	return [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
		{
			url: getBaseUrl('valorant'),
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
		{
			url: getBaseUrl('colors'),
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.2,
		},
	];
}
