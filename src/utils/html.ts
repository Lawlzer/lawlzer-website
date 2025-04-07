import type { UrlConfig } from '../types'; // We'll create this type file next

// Helper function to generate HTML response with top-bar
export const createHtmlResponse = (title: string, content: string, navUrls: UrlConfig): Response => {
	const topBar = `
<nav style="background-color: #333; padding: 10px; text-align: center;">
  <a href="${navUrls.home}" style="color: white; margin: 0 15px; text-decoration: none;">Home</a>
  <a href="${navUrls.valorant}" style="color: white; margin: 0 15px; text-decoration: none;">Valorant</a>
  <a href="${navUrls.overwatch}" style="color: white; margin: 0 15px; text-decoration: none;">Overwatch</a>
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
