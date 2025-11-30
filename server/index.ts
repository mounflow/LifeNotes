import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import connectDB, { User, Note, Series } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// --- Middleware ---
const protect = async (req: any, res: any, next: any) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ username, password: hashedPassword });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                username: user.username,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: '30d',
    });
};

// --- Data Routes (Protected) ---

// Get Items
app.get('/api/items', protect, async (req: any, res) => {
    try {
        const items = await Note.find({ user: req.user._id }).sort({ date: -1 });
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Add/Update Item (Upsert logic for simplicity to match frontend)
app.post('/api/items', protect, async (req: any, res) => {
    const item = req.body;
    try {
        // Check if item exists by ID
        let existing = await Note.findOne({ id: item.id, user: req.user._id });
        if (existing) {
            // Update
            Object.assign(existing, item);
            await existing.save();
            res.json(existing);
        } else {
            // Create
            const newItem = await Note.create({ ...item, user: req.user._id });
            res.status(201).json(newItem);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Item
app.delete('/api/items/:id', protect, async (req: any, res) => {
    try {
        await Note.findOneAndDelete({ id: req.params.id, user: req.user._id });
        res.json({ message: 'Item removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Get Series
app.get('/api/series', protect, async (req: any, res) => {
    try {
        const series = await Series.find({ user: req.user._id }).sort({ startDate: -1 });
        res.json(series);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Add/Update Series
app.post('/api/series', protect, async (req: any, res) => {
    const seriesData = req.body;
    try {
        let existing = await Series.findOne({ id: seriesData.id, user: req.user._id });
        if (existing) {
            Object.assign(existing, seriesData);
            await existing.save();
            res.json(existing);
        } else {
            const newSeries = await Series.create({ ...seriesData, user: req.user._id });
            res.status(201).json(newSeries);
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Series
app.delete('/api/series/:id', protect, async (req: any, res) => {
    try {
        await Series.findOneAndDelete({ id: req.params.id, user: req.user._id });
        res.json({ message: 'Series removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});


// --- AI Routes (Protected) ---
const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not set');
    }
    return new GoogleGenAI({ apiKey });
};

app.post('/api/generate', protect, async (req, res) => {
    const { model = 'gemini-2.5-flash', prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        res.json({ text: response.text() });
    } catch (e: any) {
        console.error('Backend Gemini Error:', e);
        res.status(500).json({ error: e.message || 'Generation failed' });
    }
});

const PORT = process.env.PORT || 4000;

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
