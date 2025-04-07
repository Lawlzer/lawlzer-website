import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
	sessionId: string;
	userId: mongoose.Schema.Types.ObjectId;
	expiresAt: number;
}

const SessionSchema: Schema = new Schema({
	sessionId: { type: String, required: true, unique: true, index: true },
	userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
	expiresAt: { type: Number, required: true },
});

export default mongoose.model<ISession>('Session', SessionSchema, 'sessions');
