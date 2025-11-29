import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not set');
    }
    return new GoogleGenAI({ apiKey });
};

app.post('/api/generate', async (req, res) => {
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
