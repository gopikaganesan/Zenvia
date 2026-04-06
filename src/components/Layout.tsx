import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import {
  Home,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  User,
  Menu,
  X,
  Shield,
  LogOut,
  LogIn,
} from "lucide-react";
import { Button } from "./ui/button";
import { clearAuthSession, getStoredUser, isAuthenticated } from "@/lib/auth";
import { UserAvatar } from "./UserAvatar";
import { logoutUser } from "@/lib/api";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/cycle-tracking", label: "Cycle Tracker", icon: Calendar },
  { to: "/nearby-services", label: "Nearby Services", icon: MapPin },
  { to: "/community", label: "Community", icon: Users },
  { to: "/sos", label: "SOS", icon: AlertTriangle },
];

function getPageTitle(pathname: string) {
  if (pathname === "/") return "Zenvia | Home";
  if (pathname.startsWith("/cycle-tracking")) return "Zenvia | Cycle Tracker";
  if (pathname.startsWith("/nearby-services")) return "Zenvia | Nearby Services";
  if (pathname.startsWith("/community")) return "Zenvia | Community";
  if (pathname.startsWith("/sos")) return "Zenvia | SOS Emergency";
  if (pathname.startsWith("/profile")) return "Zenvia | Profile";
  return "Zenvia";
}

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [userAvatar, setUserAvatar] = useState(getStoredUser()?.avatarUrl || "");
  const [userName, setUserName] = useState(getStoredUser()?.name || "");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    const current = getStoredUser();
    setUserAvatar(current?.avatarUrl || "");
    setUserName(current?.name || "");
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    clearAuthSession();
    setLoggedIn(false);
    setUserAvatar("");
    setUserName("");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="bg-white/90 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl bg-gradient-to-r from-violet-700 to-pink-600 bg-clip-text text-transparent tracking-tight"
                style={{ fontWeight: 700 }}>
                Zenvia
              </span>
            </NavLink>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                const isSOS = item.to === "/sos";
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isSOS
                        ? isActive
                          ? "bg-red-600 text-white shadow-lg shadow-red-200"
                          : "text-red-600 hover:bg-red-50"
                        : isActive
                        ? "bg-violet-100 text-violet-800"
                        : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm" style={{ fontWeight: 500 }}>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Profile + Mobile Menu */}
            <div className="flex items-center gap-2">
              {loggedIn ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/profile")}
                    className={`flex items-center gap-2  ${
                      location.pathname === "/profile"
                        ? "bg-violet-100 text-violet-800 py-6"
                        : "py-6"
                    }`}
                  >
                    <UserAvatar
                      name={userName || "Profile"}
                      imageUrl={userAvatar}
                      seed={userName || "profile"}
                      className="w-8 h-8 border border-violet-200"
                    />
                    <span className="hidden sm:inline text-sm">Profile</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}
                  className={location.pathname === "/login" ? "bg-violet-100 text-violet-800 " : "py-6 px-3"}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  <span className="text-sm">Login</span>
                </Button>
              )}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-violet-50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-100 bg-white/95 backdrop-blur-md">
            <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                const isSOS = item.to === "/sos";
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isSOS
                        ? isActive
                          ? "bg-red-600 text-white"
                          : "text-red-600 hover:bg-red-50"
                        : isActive
                        ? "bg-violet-100 text-violet-800"
                        : "text-gray-600 hover:bg-violet-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span style={{ fontWeight: 500 }}>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm bg-gradient-to-r from-violet-700 to-pink-600 bg-clip-text text-transparent" style={{ fontWeight: 700 }}>Zenvia</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 py-6">
              <NavLink to="/cycle-tracking" className="hover:text-violet-700">Cycle Tracker</NavLink>
              <NavLink to="/nearby-services" className="hover:text-violet-700">Nearby Services</NavLink>
              <NavLink to="/community" className="hover:text-violet-700">Community</NavLink>
              <NavLink to="/sos" className="hover:text-violet-700">SOS</NavLink>
            </nav>
            <p className="text-xs text-gray-400">&copy; 2026 Zenvia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
