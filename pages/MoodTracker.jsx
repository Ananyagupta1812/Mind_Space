import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import API from '../api/axios';

const getBarColor = (score) => {
  if (score > 0.3) return '#34d399';
  if (score < -0.1) return '#f87171';
  return '#fbbf24';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const mood = score > 0.3 ? '😊 Positive' : score < -0.1 ? '😔 Negative' : '😐 Neutral';
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400">{label}</p>
        <p className="text-white font-medium">{mood}</p>
        <p className="text-gray-400">Score: {score?.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function MoodTracker() {
  const [view, setView] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodData();
  }, []);

  const fetchMoodData = async () => {
    setLoading(true);
    try {
      const [weeklyRes, monthlyRes] = await Promise.all([
        API.get('/mood/weekly'),
        API.get('/mood/monthly')
      ]);

      // Format weekly data for chart
      const formatted = weeklyRes.data.map((entry) => ({
        day: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }),
        score: entry.score,
        label: entry.label
      }));
      setWeeklyData(formatted);
      setMonthlyData(monthlyRes.data);
    } catch (err) {
      console.error('Failed to fetch mood data:', err);
    } finally {
      setLoading(false);
    }
  };

  const positiveCount = weeklyData.filter(d => d.score > 0.3).length;
  const negativeCount = weeklyData.filter(d => d.score < -0.1).length;
  const neutralCount = weeklyData.length - positiveCount - negativeCount;
  const avgScore = weeklyData.length
    ? (weeklyData.reduce((a, b) => a + b.score, 0) / weeklyData.length).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Mood Tracker</h1>
          <p className="text-gray-400 mt-1">Your emotional patterns over time</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{positiveCount}</p>
            <p className="text-gray-400 text-xs mt-1">Positive Days</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{negativeCount}</p>
            <p className="text-gray-400 text-xs mt-1">Negative Days</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{neutralCount}</p>
            <p className="text-gray-400 text-xs mt-1">Neutral Days</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-violet-400">{avgScore}</p>
            <p className="text-gray-400 text-xs mt-1">Avg Score</p>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

          {/* Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">
              {view === 'weekly' ? 'This Week' : 'This Month'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setView('weekly')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition
                  ${view === 'weekly'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setView('monthly')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition
                  ${view === 'monthly'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-400">Loading mood data...</p>
            </div>
          ) : (
            <>
              {/* Weekly Chart */}
              {view === 'weekly' && (
                <div>
                  {weeklyData.length === 0 ? (
                    <div className="flex items-center justify-center h-48">
                      <p className="text-gray-400 text-sm">No mood data yet. Start journalling to see your mood trends!</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-500 text-xs mb-4">
                        Sentiment score per entry — above 0 is positive, below 0 is negative
                      </p>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                          <YAxis domain={[-1, 1]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                            {weeklyData.map((entry, index) => (
                              <Cell key={index} fill={getBarColor(entry.score)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              )}

              {/* Monthly Chart */}
              {view === 'monthly' && (
                <div>
                  {monthlyData.length === 0 ? (
                    <div className="flex items-center justify-center h-48">
                      <p className="text-gray-400 text-sm">No monthly data yet. Keep journalling!</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-500 text-xs mb-4">
                        Number of positive, neutral, and negative entries per week
                      </p>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                            labelStyle={{ color: '#9ca3af' }}
                            itemStyle={{ color: '#e5e7eb' }}
                          />
                          <Bar dataKey="positive" fill="#34d399" radius={[4, 4, 0, 0]} name="Positive" />
                          <Bar dataKey="neutral" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Neutral" />
                          <Bar dataKey="negative" fill="#f87171" radius={[4, 4, 0, 0]} name="Negative" />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
              )}

              {/* Legend */}
              <div className="flex gap-4 justify-center mt-4">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span> Positive
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Neutral
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span> Negative
                </span>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Charts update automatically as you add journal entries
        </p>

      </div>
    </div>
  );
}