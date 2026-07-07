const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const OpenAI = require('openai');
const Groq = require('groq-sdk');
const fs = require('fs');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// File upload config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Helper — analyze sentiment via Groq
const analyzeSentiment = async (text) => {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', 
      messages: [{
        role: 'user',
        content: `Analyze the sentiment of this text. Respond ONLY with a valid JSON object like this: {"label": "positive", "score": 0.8}. The label must be one of: positive, negative, neutral. The score must be a number between 0 and 1. Text: "${text}"`
      }],
      max_tokens: 100
    });

    const raw = response.choices[0].message.content.trim();
    return JSON.parse(raw);
  } catch {
    return { label: 'neutral', score: 0.5 };
  }
};

// GET all journals for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const journals = await prisma.journal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(journals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST text journal
router.post('/text', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const sentiment = await analyzeSentiment(content);

    const journal = await prisma.journal.create({
      data: {
        userId: req.userId,
        type: 'text',
        content,
        sentiment: sentiment.label,
        sentimentScore: sentiment.score
      }
    });

    await prisma.moodEntry.create({
      data: {
        userId: req.userId,
        score: sentiment.label === 'negative' ? -sentiment.score : sentiment.score,
        label: sentiment.label
      }
    });

    res.status(201).json(journal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST audio/video journal
router.post('/media', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mediaType = req.body.type || 'audio';
    const filePath = req.file.path;

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1'
    });
    const content = transcription.text;

    const sentiment = await analyzeSentiment(content);

    const journal = await prisma.journal.create({
      data: {
        userId: req.userId,
        type: mediaType,
        content,
        mediaUrl: filePath,
        sentiment: sentiment.label,
        sentimentScore: sentiment.score
      }
    });

    await prisma.moodEntry.create({
      data: {
        userId: req.userId,
        score: sentiment.label === 'negative' ? -sentiment.score : sentiment.score,
        label: sentiment.label
      }
    });

    res.status(201).json({ ...journal, transcription: content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// DELETE a journal entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const journal = await prisma.journal.findUnique({
      where: { id: req.params.id }
    });

    if (!journal || journal.userId !== req.userId) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    await prisma.journal.delete({ where: { id: req.params.id } });
    res.json({ message: 'Journal deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;