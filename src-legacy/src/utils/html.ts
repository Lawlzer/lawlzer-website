import type { UrlConfig, UserSession } from '../types'; // Import UserSession

// Helper function to generate HTML response with top-bar and user info
export const createHtmlResponse = (
	title: string,
	content: string,
	navUrls: UrlConfig,
	userSession?: UserSession // Make userSession optional for routes that might not have it
): Response => {
	let userInfo = '';
	if (userSession?.user) {
		if (userSession.user.username) {
			userInfo = `<span style="color: white; margin-left: auto; margin-right: 15px;">Welcome, ${userSession.user.username}!</span> <a href="/logout" style="color: #aaa; margin-right: 15px; text-decoration: none;">Logout</a>`;
		} else {
			// User is logged in but hasn't set a username
			userInfo = `<a href="/setup-username" style="color: white; margin-left: auto; margin-right: 15px; text-decoration: none;">Setup Username</a> <a href="/logout" style="color: #aaa; margin-right: 15px; text-decoration: none;">Logout</a>`;
		}
	} else {
		userInfo = `<a href="/login" style="color: white; margin-left: auto; margin-right: 15px; text-decoration: none;">Login/Register</a>`;
	}

	const topBar = `
<nav style="background-color: #333; padding: 10px; display: flex; align-items: center;">
  <a href="${navUrls.home}" style="color: white; margin: 0 15px; text-decoration: none;">Home</a>
  <a href="${navUrls.valorant}" style="color: white; margin: 0 15px; text-decoration: none;">Valorant</a>
  <a href="${navUrls.overwatch}" style="color: white; margin: 0 15px; text-decoration: none;">Overwatch</a>
  ${userInfo}
</nav>
  `;
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; font-family: sans-serif; }
  </style>
</head>
<body>
  ${topBar}
  <main style="padding: 20px;">
    <h1>${title}</h1>
    ${content}
  </main>
</body>
</html>
  `;
	return new Response(html, { headers: { 'Content-Type': 'text/html' } });
};
