const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// GET weekly mood data
router.get('/weekly', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const moods = await prisma.moodEntry.findMany({
      where: {
        userId: req.userId,
        date: { gte: sevenDaysAgo }
      },
      orderBy: { date: 'asc' }
    });

    res.json(moods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET monthly mood data
router.get('/monthly', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moods = await prisma.moodEntry.findMany({
      where: {
        userId: req.userId,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: 'asc' }
    });

    // Group by week
    const weeks = { 'Week 1': [], 'Week 2': [], 'Week 3': [], 'Week 4': [] };
    moods.forEach(mood => {
      const daysAgo = Math.floor((new Date() - new Date(mood.date)) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 7) weeks['Week 4'].push(mood);
      else if (daysAgo <= 14) weeks['Week 3'].push(mood);
      else if (daysAgo <= 21) weeks['Week 2'].push(mood);
      else weeks['Week 1'].push(mood);
    });

    const monthlyData = Object.entries(weeks).map(([week, entries]) => ({
      week,
      positive: entries.filter(e => e.label === 'positive').length,
      neutral: entries.filter(e => e.label === 'neutral').length,
      negative: entries.filter(e => e.label === 'negative').length,
    }));

    res.json(monthlyData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;