import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

const port = 3001;
const htmlContent = readFileSync(join(process.cwd(), 'public/valorant/index.html'), 'utf-8');

const server = createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end(htmlContent);
});

server.listen(port, () => {
	console.log(`Valorant subdomain server running at http://localhost:${port}`);
	console.log('In production, this would be accessible at valorant.lawlzer.com');
});
