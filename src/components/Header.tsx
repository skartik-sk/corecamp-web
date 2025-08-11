import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthState } from '@campnetwork/origin/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Store, 
  Plus, 
  MessageCircle, 
  User, 
  Dice6, 
  Sun,
  Moon,
  Sparkles,
  Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'Auctions', href: '/auctions', icon: Dice6 },
  { name: 'Lottery', href: '/lottery', icon: Zap },
  { name: 'Create IP', href: '/create', icon: Plus },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'My IPs', href: '/my-ips', icon: User },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authenticated } = useAuthState();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white/90 dark:bg-camp-dark/90 backdrop-blur-xl border-b border-cool-3/20 dark:border-cool-1/20 shadow-xl"
    >
      <nav className="mx-auto max-w-7xl " aria-label="Top">
        <div className="flex w-full items-center justify-between py-6 lg:border-none">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-camp-orange to-warm-1 rounded-2xl flex items-center justify-center shadow-lg">
                  <img 
                    src="../../public/logo.png" 
                    alt="Campfire Logo" 
                    className="w-8 h-8 rounded-xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      ((e.currentTarget.nextElementSibling as HTMLElement)).style.display = 'block';
                    }}
                  />
                  <Sparkles className="w-6 h-6 text-white hidden" />
                </div>
              </motion.div>
              <div className="ml-3">
                <motion.h1 
                  whileHover={{ x: 2 }}
                  className="text-2xl font-bold text-camp-dark dark:text-white"
                >
                  Campfire
                </motion.h1>
                <p className="text-xs text-cool-1 dark:text-cool-2 font-medium">
                  IP Marketplace
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  location.pathname === item.href
                    ? 'text-white bg-gradient-to-r from-camp-orange to-warm-1 shadow-lg'
                    : 'text-camp-dark dark:text-white hover:text-camp-orange dark:hover:text-warm-1 hover:bg-cool-3/20 dark:hover:bg-cool-1/20'
                }`}
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-cool-3/20 dark:bg-cool-1/20 text-camp-dark dark:text-white hover:bg-camp-orange/20 transition-all duration-300"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </motion.button>

            {/* Connect Wallet Button */}
            {authenticated ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Connected
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm font-medium"
                >
                  Disconnect
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => console.log('Connect wallet clicked')}
                className="px-4 py-2 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                Connect Wallet
              </motion.button>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              className="lg:hidden p-2 rounded-xl bg-cool-3/20 dark:bg-cool-1/20 text-camp-dark dark:text-white transition-all duration-300"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="fixed top-0 right-0 w-80 h-full bg-white dark:bg-camp-dark shadow-2xl z-50 border-l border-cool-3 dark:border-cool-1"
            >
              <div className="p-6">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-camp-orange to-warm-1 rounded-xl flex items-center justify-center">
                      <img 
                        src="/logo.png" 
                        alt="Campfire Logo" 
                        className="w-6 h-6 rounded-lg"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          ((e.currentTarget.nextElementSibling as HTMLElement)).style.display = 'block';
                        }}
                      />
                      <Sparkles className="w-5 h-5 text-white hidden" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-camp-dark dark:text-white">Campfire</h2>
                      <p className="text-xs text-cool-1 dark:text-cool-2">IP Marketplace</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>

                {/* Mobile Navigation */}
                <nav className="space-y-3">
                  {navigation.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                          location.pathname === item.href
                            ? 'bg-gradient-to-r from-camp-orange to-warm-1 text-white shadow-lg'
                            : 'text-camp-dark dark:text-white hover:bg-cool-3/20 dark:hover:bg-cool-1/20 hover:text-camp-orange dark:hover:text-warm-1'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile Theme Toggle */}
                <div className="mt-6 pt-4 border-t border-cool-3 dark:border-cool-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleTheme}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-cool-3/20 dark:bg-cool-1/20 text-camp-dark dark:text-white transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      <span className="font-medium">
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-camp-orange' : 'bg-cool-3'
                    }`}>
                      <motion.div
                        animate={{ x: theme === 'dark' ? 20 : 0 }}
                        className="w-5 h-5 bg-white rounded-full shadow-lg"
                      />
                    </div>
                  </motion.button>
                </div>

                {/* Mobile Connect Wallet */}
                <div className="mt-4">
                  {authenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          Connected
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.reload()}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                      >
                        Disconnect Wallet
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        console.log('Connect wallet clicked');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                    >
                      Connect Wallet
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
