import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, BarChart2, MessageCircle, User } from 'lucide-react';
import Navbar from '../components/Navbar';

const features = [
  {
    title: 'Journal',
    description: 'Express yourself through text, audio, or video entries',
    icon: BookOpen,
    color: 'from-violet-600 to-violet-400',
    border: 'border-violet-500/30',
    hover: 'hover:border-violet-500/60',
    path: '/journal'
  },
  {
    title: 'Mood Tracker',
    description: 'Visualise your emotional patterns over time',
    icon: BarChart2,
    color: 'from-emerald-600 to-emerald-400',
    border: 'border-emerald-500/30',
    hover: 'hover:border-emerald-500/60',
    path: '/mood'
  },
  {
    title: 'Chatbot',
    description: 'Talk to an AI therapist trained in CBT & DBT techniques',
    icon: MessageCircle,
    color: 'from-blue-600 to-blue-400',
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-500/60',
    path: '/chatbot'
  },
  {
    title: 'Profile',
    description: 'Manage your account and personal settings',
    icon: User,
    color: 'from-rose-600 to-rose-400',
    border: 'border-rose-500/30',
    hover: 'hover:border-rose-500/60',
    path: '/profile'
  }
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="px-4 py-10">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <p className="text-gray-400 text-lg">{getGreeting()},</p>
            <h1 className="text-4xl font-bold text-white mt-1">{firstName} 👋</h1>
            <p className="text-gray-500 mt-2">What would you like to do today?</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.title}
                  onClick={() => navigate(feature.path)}
                  className={`bg-gray-900 border ${feature.border} ${feature.hover} rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="text-white w-6 h-6" />
                  </div>
                  <h2 className="text-white text-xl font-semibold mb-1">{feature.title}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </button>
              );
            })}
          </div>

          <p className="text-center text-gray-600 text-sm mt-10">
            MindSpace — your private space to think, feel, and grow.
          </p>

        </div>
      </div>
    </div>
  );
}