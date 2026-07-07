import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, BarChart2, MessageCircle, User, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Journal', path: '/journal', icon: BookOpen },
  { label: 'Mood', path: '/mood', icon: BarChart2 },
  { label: 'Chatbot', path: '/chatbot', icon: MessageCircle },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => navigate('/home')}
          className="text-white font-bold text-xl tracking-tight hover:text-violet-400 transition"
        >
          MindSpace
        </button>

        {/* Nav Items */}
        <div className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition
                  ${isActive
                    ? 'bg-violet-600/20 text-violet-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>

      </div>

      {/* Mobile Bottom Nav */}
      <div className="sm:hidden flex justify-around mt-2 border-t border-gray-800 pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 text-xs transition
                ${isActive ? 'text-violet-400' : 'text-gray-500 hover:text-white'}`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}