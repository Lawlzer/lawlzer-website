import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
	username: string | null;
	googleId: string | null;
	discordId: string | null;
	githubId: string | null;
	email: string | null;
}

const UserSchema: Schema = new Schema(
	{
		username: { type: String, unique: true, sparse: true, default: null },
		googleId: { type: String, unique: true, sparse: true, default: null },
		discordId: { type: String, unique: true, sparse: true, default: null },
		githubId: { type: String, unique: true, sparse: true, default: null },
		email: { type: String, unique: true, sparse: true, default: null }, // Added email
	},
	{
		timestamps: true,
	}
);

// Explicitly tell Mongoose to use the collection name 'users'
export default mongoose.model<IUser>('User', UserSchema, 'users');
