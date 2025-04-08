import express from 'express';
import { env } from './env';

const app = express();
const port = env.FRONTEND_PORT ? parseInt(env.FRONTEND_PORT) + 1 : 3001;

app.get('/', (req, res) => {
	res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Valorant Subdomain</title>
      <style>
        body {
          display: flex;
          min-height: 100vh;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to bottom, #fa4454, #1f1f1f);
          color: white;
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        h1 {
          font-size: 3rem;
          font-weight: bold;
        }
        p {
          margin-top: 1rem;
          font-size: 1.25rem;
        }
      </style>
    </head>
    <body>
      <h1>Valorant Subdomain</h1>
      <p>This is the Valorant subdomain</p>
    </body>
    </html>
  `);
});

app.listen(port, () => {
	console.log(`Valorant subdomain server running at http://localhost:${port}`);
});
