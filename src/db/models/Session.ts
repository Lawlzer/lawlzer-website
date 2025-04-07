import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
	userId: mongoose.Schema.Types.ObjectId; // _id of the user this session belongs to
	expiresAt: number; // Session expiry date (Unix timestamp)
}

const SessionSchema: Schema = new Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Link to the User model
	expiresAt: { type: Number, required: true },
});

// Index expiresAt for efficient cleanup of expired sessions - REMOVED as TTL requires Date type
// SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISession>('Session', SessionSchema, 'sessions');
