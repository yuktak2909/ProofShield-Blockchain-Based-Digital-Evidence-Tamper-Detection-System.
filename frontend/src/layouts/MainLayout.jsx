import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FolderLock, 
  FileCheck, 
  UploadCloud, 
  SearchCode, 
  History, 
  Cpu, 
  Users, 
  LogOut,
  Bell,
  Activity,
  FileText,
  X,
  Check,
  ExternalLink
} from "lucide-react";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, link) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      fetchNotifications();
      if (link) {
        setShowNotifDropdown(false);
        navigate(link);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post("/api/notifications/mark-all-read");
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Executive Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Case Dossiers", path: "/cases", icon: FolderLock, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Evidence Vault", path: "/evidence", icon: FileCheck, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Register Evidence", path: "/register", icon: UploadCloud, roles: ["admin", "investigator"] },
    { name: "Verify & Tamper Audit", path: "/verify", icon: SearchCode, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Chain of Custody", path: "/custody", icon: History, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Blockchain Ledger", path: "/blockchain-records", icon: Cpu, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Audit Ledger", path: "/audit-logs", icon: FileText, roles: ["admin", "court"] },
    { name: "System Diagnostics", path: "/system-health", icon: Activity, roles: ["admin", "court"] },
    { name: "User Clearances", path: "/users", icon: Users, roles: ["admin"] }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin": 
        return { label: "ADMINISTRATOR", bg: "bg-red-50 text-red-700 border-red-200" };
      case "investigator": 
        return { label: "INVESTIGATOR", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "analyst": 
        return { label: "FORENSIC ANALYST", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "court": 
        return { label: "COURT OFFICIAL", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      default: 
        return { label: role?.toUpperCase(), bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Authoritative Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20 text-slate-100 flex-shrink-0">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-white leading-tight flex items-center gap-1.5">
              PROOFSHIELD
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Digital Evidence Integrity
            </p>
          </div>
        </div>

        {/* User Clearance Profile */}
        <div className="p-3.5 mx-3.5 my-4 bg-slate-800/80 border border-slate-700/60 rounded-lg">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name}</p>
              <span className={`text-[9px] font-semibold border rounded px-1.5 py-0.5 inline-block mt-0.5 ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>KEY:</span>
            <span className="truncate max-w-[140px] text-slate-300" title={user?.walletAddress}>
              {user?.walletAddress ? `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(38)}` : "Unassigned"}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (!item.roles.includes(user?.role)) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white font-semibold shadow-sm" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-900 rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            End Authorized Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Institutional Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-xs relative">
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Ledger Connected: Ethereum Node (Chain 1337)
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-500 font-medium text-[11px]">
              FRE 902(13)/(14) & BSA 2023 Sec 63 Forensic Architecture
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-600">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-slate-800">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-blue-700 hover:underline font-semibold cursor-pointer"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkAsRead(n.id, n.link)}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                        >
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-tight">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200"></div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Hashing:</span>
              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                SHA-256 (FIPS 180-4)
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Off-Chain:</span>
              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                IPFS
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
