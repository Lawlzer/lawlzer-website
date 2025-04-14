import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env.playwright') });
