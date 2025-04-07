import mongoose from 'mongoose';
import { MONGODB_URI } from '../config';

let isConnected = false;

export const connectToDatabase = async () => {
	if (isConnected) {
		console.log('=> using existing database connection');
		return;
	}

	try {
		await mongoose.connect(MONGODB_URI);
		isConnected = true;
		console.log('=> new database connection established');
	} catch (error) {
		console.error('Error connecting to database:', error);
		throw new Error('Database connection failed');
	}
};
