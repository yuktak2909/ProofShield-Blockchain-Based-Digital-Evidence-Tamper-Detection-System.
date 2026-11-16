import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ProofShieldLogo from "../components/ProofShieldLogo";
import { 
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
  const [bcStatus, setBcStatus] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      // Non-blocking
    }
  };

  const fetchBlockchainStatus = async () => {
    try {
      const res = await axios.get("/api/health/blockchain");
      setBcStatus(res.data);
    } catch (e) {
      setBcStatus({
        node: { status: "UNAVAILABLE" },
        smartContract: { status: "UNAVAILABLE" },
        label: "Ledger Standby: Redundant Local Storage Active",
        badgeColor: "amber"
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchBlockchainStatus();
    const notifInterval = setInterval(fetchNotifications, 15000);
    const bcInterval = setInterval(fetchBlockchainStatus, 8000);
    return () => {
      clearInterval(notifInterval);
      clearInterval(bcInterval);
    };
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

  const workspaceNavItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Cases", path: "/cases", icon: FolderLock, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Evidence Records", path: "/evidence", icon: FileCheck, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Register Evidence", path: "/register", icon: UploadCloud, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Evidence Verification", path: "/verify", icon: SearchCode, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Chain of Custody", path: "/custody", icon: History, roles: ["admin", "investigator", "analyst", "court"] },
  ];

  const adminNavItems = [
    { name: "Blockchain Records", path: "/blockchain-records", icon: Cpu, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Audit Log", path: "/audit-logs", icon: FileText, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "System Status", path: "/system-status", icon: Activity, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "User Clearances", path: "/users", icon: Users, roles: ["admin"] }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin": 
        return { label: "ADMINISTRATOR", bg: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]" };
      case "investigator": 
        return { label: "INVESTIGATOR", bg: "bg-[#F2E2E7] text-[#873D50] border-[#E5C3CD]" };
      case "analyst": 
        return { label: "FORENSIC ANALYST", bg: "bg-[#F9F5FF] text-[#6941C6] border-[#E9D7FE]" };
      case "court": 
        return { label: "COURT OFFICIAL", bg: "bg-[#EDFDF5] text-[#087443] border-[#A6F4C5]" };
      default: 
        return { label: role?.toUpperCase(), bg: "bg-[#FAF8F7] text-[#57515A] border-[#E8E4E1]" };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F5F3F2] text-[#343239] flex font-sans">
      {/* Primary Sidebar (Charcoal #343239) - Fixed & Docked */}
      <aside className="w-64 h-full bg-[#343239] border-r border-[#2A282E] flex flex-col z-20 text-[#D5D0D9] flex-shrink-0 select-none">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-[#28262C] bg-[#2A282E] flex items-center justify-between shrink-0">
          <ProofShieldLogo variant="dark" size="md" />
        </div>

        {/* User Clearance Profile */}
        <div className="p-3 mx-3 my-3 bg-[#403D46]/80 border border-[#4E4A56] rounded-xl shadow-2xs shrink-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-7 w-7 rounded-lg bg-[#57515A] flex items-center justify-center text-[#F2E2E7] font-bold text-xs shadow-2xs">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name}</p>
              <span className={`text-[9px] font-bold border rounded px-1.5 py-0.5 inline-block mt-0.5 tracking-wider ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#4E4A56] flex items-center justify-between text-[10px] text-[#A8A2AE] font-mono">
            <span>KEY:</span>
            <span className="truncate max-w-[140px] text-[#E0DCE2]" title={user?.walletAddress}>
              {user?.walletAddress ? `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(38)}` : "Unassigned"}
            </span>
          </div>
        </div>

        {/* Navigation Links Grouped (Scrollable with hidden/slim scrollbar) */}
        <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto min-h-0">
          {/* Main Workspace Group */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#A8A2AE] block mb-1.5 font-mono">
              Main Workspace
            </span>
            <div className="space-y-1">
              {workspaceNavItems.map((item) => {
                if (!item.roles.includes(user?.role)) return null;
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive 
                        ? "bg-[#F2E2E7] text-[#873D50] font-bold shadow-2xs border-l-3 border-[#873D50]" 
                        : "text-[#D5D0D9] hover:bg-[#403D46] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#873D50]" : "text-[#9E97A4]"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Records & Administration Group */}
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#A8A2AE] block mb-1.5 font-mono">
              Records & Administration
            </span>
            <div className="space-y-1">
              {adminNavItems.map((item) => {
                if (!item.roles.includes(user?.role)) return null;
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive 
                        ? "bg-[#F2E2E7] text-[#873D50] font-bold shadow-2xs border-l-3 border-[#873D50]" 
                        : "text-[#D5D0D9] hover:bg-[#403D46] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#873D50]" : "text-[#9E97A4]"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Sign Out Button - Permanently Anchored & Intact */}
        <div className="p-3 border-t border-[#28262C] bg-[#2A282E] shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-[#403D46] hover:bg-[#873D50] text-[#F2E2E7] hover:text-white border border-[#4E4A56] hover:border-[#873D50] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Institutional Header (White with Warm Grey Border) */}
        <header className="h-14 bg-white border-b border-[#E8E4E1] flex items-center justify-between px-8 z-10 shadow-2xs relative shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/system-status"
              title={
                bcStatus?.node?.status === "OPERATIONAL"
                  ? `Ethereum Node Connected (Chain ${bcStatus.node.chainId}, Block #${bcStatus.node.blockNumber}) • Contract: ${bcStatus.smartContract?.status}`
                  : "Ethereum node offline at http://127.0.0.1:8545. Click to inspect system status."
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-[11px] border transition-colors ${
                bcStatus?.badgeColor === "emerald"
                  ? "bg-[#EDFDF5] text-[#087443] border-[#A6F4C5] hover:bg-[#DCFAE8]"
                  : bcStatus?.badgeColor === "amber"
                  ? "bg-[#FEF6EE] text-[#986000] border-[#FEDF89] hover:bg-[#FDF0E1]"
                  : "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] hover:bg-[#FDE8E7]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${
                bcStatus?.badgeColor === "emerald"
                  ? "bg-[#087443] animate-pulse"
                  : bcStatus?.badgeColor === "amber"
                  ? "bg-[#986000]"
                  : "bg-[#B42318]"
              }`}></span>
              {bcStatus?.label || "Probing Ethereum Ledger..."}
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#57515A]">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-lg bg-[#FAF8F7] hover:bg-[#F2E2E7]/60 border border-[#E8E4E1] text-[#57515A] hover:text-[#873D50] relative cursor-pointer transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#873D50] text-white text-[9px] font-bold flex items-center justify-center shadow-2xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E8E4E1] rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 bg-[#FAF8F7] border-b border-[#E8E4E1] flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#343239]">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-[#873D50] hover:text-[#732F40] hover:underline font-bold cursor-pointer"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#F0ECE9]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-[#8C8490] text-xs">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkAsRead(n.id, n.link)}
                          className={`p-3 text-xs hover:bg-[#FAF8F7] cursor-pointer transition-colors ${!n.isRead ? "bg-[#FAF2F5]" : ""}`}
                        >
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-[#343239]">{n.title}</span>
                            <span className="text-[10px] text-[#8C8490]">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-[#57515A] text-[11px] leading-tight">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-[#E8E4E1]"></div>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] text-[#57515A] font-medium">Hashing:</span>
              <span className="font-mono font-semibold text-[#343239] bg-[#FAF8F7] px-2 py-0.5 rounded border border-[#E8E4E1] text-[11px]">
                SHA-256 (FIPS 180-4)
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] text-[#57515A] font-medium">Off-Chain:</span>
              <span className="font-mono font-semibold text-[#343239] bg-[#FAF8F7] px-2 py-0.5 rounded border border-[#E8E4E1] text-[11px]">
                IPFS
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Body (Warm Grey #F5F3F2) */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F5F3F2]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
