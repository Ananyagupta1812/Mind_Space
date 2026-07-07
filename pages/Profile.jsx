import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { LogOut, Trash2, User, Mail, Calendar } from 'lucide-react';
import API from '../api/axios';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({ total: 0, positive: 0, negative: 0, neutral: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await API.get('/journals');
      const journals = response.data;
      setStats({
        total: journals.length,
        positive: journals.filter(j => j.sentiment === 'positive').length,
        negative: journals.filter(j => j.sentiment === 'negative').length,
        neutral: journals.filter(j => j.sentiment === 'neutral').length,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await API.delete('/auth/delete');
      logout();
      navigate('/login');
    } catch (err) {
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 mt-1">Manage your account</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">

          {/* Avatar + Name */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-bold">
                {getInitials(user?.name)}
              </span>
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">{user?.name}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Info Items */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Full Name</p>
                <p className="text-white text-sm">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Email Address</p>
                <p className="text-white text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs">Member Since</p>
                <p className="text-white text-sm">{joinedDate}</p>
              </div>
            </div>
          </div>

          {/* Journal Stats */}
          <div>
            <p className="text-gray-500 text-xs font-medium mb-3">JOURNAL STATS</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-lg">{stats.total}</p>
                <p className="text-gray-500 text-xs">Total</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-emerald-400 font-bold text-lg">{stats.positive}</p>
                <p className="text-gray-500 text-xs">Positive</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-yellow-400 font-bold text-lg">{stats.neutral}</p>
                <p className="text-gray-500 text-xs">Neutral</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-red-400 font-bold text-lg">{stats.negative}</p>
                <p className="text-gray-500 text-xs">Negative</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-2xl px-4 py-4 transition mb-4"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>

        {/* Delete Account Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-2xl px-4 py-4 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span className="font-medium">Delete Account</span>
        </button>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-white text-lg font-semibold">Delete Account</h3>
              </div>

              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                This action is <span className="text-red-400 font-medium">permanent and irreversible</span>. All your journal entries, mood data, and account information will be deleted forever.
              </p>

              <p className="text-gray-400 text-sm mb-2">
                Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm:
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition text-sm mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-3 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-medium transition"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}