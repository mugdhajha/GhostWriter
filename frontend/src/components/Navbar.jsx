// components/Navbar.jsx

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Close the mobile menu on route changes
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `px-4 py-1.5 rounded text-sm font-medium transition-all ${
      isActive(path)
        ? "bg-ink-100 text-ink-800"
        : "text-ink-500 hover:text-ink-800 hover:bg-cream-200"
    }`;

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

        {/* Desktop nav links + user info */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/dashboard" className={navLinkClass("/dashboard")}>
            Generate
          </Link>

          <Link to="/history" className={navLinkClass("/history")}>
            History
          </Link>

          <Link to="/profile" className={navLinkClass("/profile")}>
            Samples
          </Link>

          <div className="w-px h-4 bg-cream-300 mx-2" />

          <span className="text-xs text-ink-400 font-mono hidden lg:block mr-2">
            {user?.email}
          </span>

          <button
            onClick={handleLogout}
            className="text-sm text-ink-500 hover:text-accent transition-colors px-3 py-1.5 rounded hover:bg-accent-light"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <label className="burger" aria-label="Toggle menu">
            <input
              type="checkbox"
              checked={mobileOpen}
              onChange={(e) => setMobileOpen(e.target.checked)}
            />
            <span />
            <span />
            <span />
          </label>
        </div>
      </div>

      {/* Mobile menu (overlay) */}
      {mobileOpen && (
        <div className="md:hidden border-t border-cream-400 bg-cream-50/90 paper-surface">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-col gap-2">
              <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                Generate
              </Link>
              <Link to="/history" className={navLinkClass("/history")}>
                History
              </Link>
              <Link to="/profile" className={navLinkClass("/profile")}>
                Samples
              </Link>

              <div className="h-px bg-cream-300 my-2" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-ink-400 font-mono truncate">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-ink-500 hover:text-accent transition-colors px-3 py-1.5 rounded hover:bg-accent-light"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
