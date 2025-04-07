import { createHtmlResponse } from '../utils/html';
import type { UrlConfig } from '../types';

export const handleOverwatchHome = ({ navUrls }: { navUrls: UrlConfig }): Response => {
	return createHtmlResponse('Overwatch Home', '<p>This is the homepage for the Overwatch section.</p>', navUrls);
};
