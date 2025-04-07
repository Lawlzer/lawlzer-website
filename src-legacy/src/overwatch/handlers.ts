import { createHtmlResponse } from '../utils/html';
import type { UrlConfig, UserSession } from '../types';

export const handleOverwatchHome = ({ navUrls, user, session }: { navUrls: UrlConfig; user: UserSession['user']; session: UserSession['session'] }): Response => {
	return createHtmlResponse('Overwatch Home', '<p>This is the homepage for the Overwatch section.</p>', navUrls, { user, session });
};
