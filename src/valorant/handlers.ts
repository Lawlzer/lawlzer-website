import { createHtmlResponse } from '../utils/html';
import type { UrlConfig } from '../types';

export const handleValorantHome = ({ navUrls }: { navUrls: UrlConfig }): Response => {
	return createHtmlResponse('Valorant Home', '<p>This is the homepage for the Valorant section.</p>', navUrls);
};
