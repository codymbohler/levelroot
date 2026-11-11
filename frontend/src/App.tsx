import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { useState, FormEvent, useRef, useEffect } from 'react';

import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserPage from './pages/UserPage';
import AllGamesPage from './pages/AllGamesPage';
import FollowersPage from './pages/FollowersPage';
import SearchPage from './pages/SearchPage';
import UserGamesPage from './pages/UserGamesPage';
import UserReviewsPage from './pages/UserReviewsPage';
import WishlistPage from './pages/WishlistPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import FilterPage from './pages/FilterPage';

function Header() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isImmersivePage = 
  location.pathname === '/' || 
  (location.pathname.startsWith('/games/') && location.pathname !== '/games') || 
  location.pathname.startsWith('/user/');

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setIsSearchOpen(false);
    }
  }

  return (
    <header 
      className={`px-8 py-4 flex items-center justify-between gap-6 sticky top-0 z-50 transition-colors duration-300 ${
        isImmersivePage 
          ? 'bg-gradient-to-b from-black/80 to-transparent border-transparent drop-shadow-md' 
          : 'bg-canvas/90 backdrop-blur-md border-b border-hairline'
      }`}
    >
      
      {/* Logo */}
      <Link to="/" className="shrink-0 flex items-center">
        <h1 className="text-3xl font-display font-semibold tracking-tight text-white drop-shadow-md lowercase">levelroot</h1>
      </Link>

      <div className="flex-1" /> {/* Spacer */}

      <nav className="flex items-center gap-6 text-sm font-medium shrink-0">
        {/* User Dropdown */}
        {loading ? null : user ? (
          <div className="relative group py-2">
            <button 
              className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors drop-shadow-sm"
            >
              {user.display_name || user.username}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-hairline rounded-lg shadow-xl overflow-hidden py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <Link to="/" className="block px-4 py-2 hover:bg-surface-hover text-ink text-sm">Home</Link>
              <Link to={`/user/${user.username}`} className="block px-4 py-2 hover:bg-surface-hover text-ink text-sm">Profile</Link>
              <Link to={`/user/${user.username}/games`} className="block px-4 py-2 hover:bg-surface-hover text-ink text-sm">Games</Link>
              <Link to={`/user/${user.username}/reviews`} className="block px-4 py-2 hover:bg-surface-hover text-ink text-sm">Reviews</Link>
              <Link to={`/user/${user.username}/wishlist`} className="block px-4 py-2 hover:bg-surface-hover text-ink text-sm">Want to Play</Link>
			  <Link to="/settings" className="block px-4 py-2 hover:bg-surface-hover text-ink text-sm">Settings</Link>
              <div className="h-px bg-hairline my-1" />
				{user?.is_admin && (
				<Link to="/admin" className="block px-4 py-2 hover:bg-surface-hover text-accent-green text-sm font-bold">Admin Panel</Link>
				)}
              <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-4 py-2 hover:bg-surface-hover text-red-400 text-sm">Sign Out</button>
            </div>
          </div>
        ) : (
          <>
            <Link to="/login" className="text-white/80 hover:text-white transition-colors drop-shadow-sm">Sign in</Link>
            <Link to="/register" className="px-5 py-2 rounded-full bg-accent-green text-white font-semibold hover:bg-accent-green-hover transition-colors">Join</Link>
          </>
        )}

        {/* GAMES Link */}
        <Link to="/games" className="text-white/80 hover:text-white transition-colors tracking-widest text-xs font-bold drop-shadow-sm lowercase">
          games
        </Link>

        {/* Expanding Search */}
        <div className="flex items-center relative">
          <form 
            onSubmit={handleSearch} 
            className={`flex items-center transition-all duration-300 ease-in-out origin-right ${
              isSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
            }`}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => !search && setIsSearchOpen(false)}
              className="w-full px-4 py-1.5 bg-black/40 border border-white/20 rounded-full text-white text-sm focus:outline-none focus:border-ps-blue backdrop-blur-md"
            />
          </form>
          
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all drop-shadow-sm ${isSearchOpen ? 'ml-2' : 'ml-0'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </div>
      </nav>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-canvas text-ink">
          <div className="max-w-[1200px] mx-auto w-full border-x border-hairline min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/games" element={<AllGamesPage />} />
                <Route path="/games/:slug" element={<GamePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/user/:username" element={<UserPage />} />
                <Route path="/user/:username/followers" element={<FollowersPage mode="followers" />} />
                <Route path="/user/:username/following" element={<FollowersPage mode="following" />} />
                <Route path="/user/:username/games" element={<UserGamesPage />} />
                <Route path="/user/:username/reviews" element={<UserReviewsPage />} />
                <Route path="/user/:username/wishlist" element={<WishlistPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/search" element={<SearchPage />} />
				<Route path="/admin" element={<AdminPage />} />
				<Route path="/developer/:value" element={<FilterPage type="developer" />} />
				<Route path="/publisher/:value" element={<FilterPage type="publisher" />} />
				<Route path="/genre/:value" element={<FilterPage type="genre" />} />
              </Routes>
            </main>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
