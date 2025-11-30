import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        // Don't exit process in Vercel environment, just log error
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
};

// User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});

// Note Schema (WorkItem)
const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    id: { type: String, required: true }, // Client-side ID
    content: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    title: { type: String },
    seriesId: { type: String },
}, {
    timestamps: true
});

// Series Schema
const seriesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    id: { type: String, required: true }, // Client-side ID
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, required: true },
}, {
    timestamps: true
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);
export const Series = mongoose.models.Series || mongoose.model('Series', seriesSchema);

export default connectDB;
