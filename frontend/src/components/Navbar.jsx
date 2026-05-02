// components/Navbar.jsx

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-paper sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-lg text-accent">✒</span>
          <span className="font-display font-semibold text-ink-800 text-lg tracking-tight">
            GhostWriter<span className="text-accent">++</span>
          </span>
        </Link>

        {/* Nav links + user info */}
        <div className="flex items-center gap-1">
          <Link
            to="/dashboard"
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
              isActive("/dashboard")
                ? "bg-ink-100 text-ink-800"
                : "text-ink-500 hover:text-ink-800 hover:bg-cream-200"
            }`}
          >
            Generate
          </Link>
          <Link
            to="/profile"
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
              isActive("/profile")
                ? "bg-ink-100 text-ink-800"
                : "text-ink-500 hover:text-ink-800 hover:bg-cream-200"
            }`}
          >
            Samples
          </Link>

          <div className="w-px h-4 bg-cream-300 mx-2" />

          <span className="text-xs text-ink-400 font-mono hidden sm:block mr-2">
            {user?.email}
          </span>

          <button
            onClick={handleLogout}
            className="text-sm text-ink-500 hover:text-accent transition-colors px-3 py-1.5 rounded hover:bg-accent-light"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
