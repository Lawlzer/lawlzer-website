import { createHtmlResponse } from '../utils/html';
import type { UrlConfig, UserSession } from '../types';

export const handleValorantHome = ({ navUrls, user, session }: { navUrls: UrlConfig; user: UserSession['user']; session: UserSession['session'] }): Response => {
	return createHtmlResponse('Valorant Home', '<p>This is the homepage for the Valorant section.</p>', navUrls, { user, session });
};
