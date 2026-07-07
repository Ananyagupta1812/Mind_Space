const router = require('express').Router();
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a professional mental health support assistant trained in Cognitive Behavioral Therapy (CBT) and Dialectical Behavior Therapy (DBT) techniques.

Your approach:
- You do NOT simply validate or echo emotions back. You gently challenge unhelpful thought patterns.
- You use CBT techniques: identifying cognitive distortions, thought records, behavioral activation.
- You use DBT skills: distress tolerance (TIPP, ACCEPTS), emotion regulation, mindfulness, interpersonal effectiveness.
- You are warm but honest. You do not coddle. You help users develop real coping skills.
- You ask clarifying questions to understand the situation before giving advice.
- You always remind users that you are an AI and recommend professional therapy for serious issues.
- You speak like a calm, knowledgeable therapist, not a cheerleader.
- Keep responses concise and focused — maximum 150 words per response.`;

router.post('/message', auth, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 300
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ error: 'Chatbot error' });
  }
});

module.exports = router;