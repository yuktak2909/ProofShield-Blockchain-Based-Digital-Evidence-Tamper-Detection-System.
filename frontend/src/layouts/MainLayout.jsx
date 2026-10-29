import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  FolderLock, 
  FileCheck, 
  UploadCloud, 
  SearchCode, 
  History, 
  Cpu, 
  Users, 
  LogOut,
  UserCheck
} from "lucide-react";

const MainLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Cases", path: "/cases", icon: FolderLock, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Evidence Vault", path: "/evidence", icon: FileCheck, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Register Evidence", path: "/register", icon: UploadCloud, roles: ["admin", "investigator"] },
    { name: "Verify Evidence", path: "/verify", icon: SearchCode, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Chain of Custody", path: "/custody", icon: History, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Blockchain Records", path: "/blockchain-records", icon: Cpu, roles: ["admin", "investigator", "analyst", "court"] },
    { name: "Users Management", path: "/users", icon: Users, roles: ["admin"] }
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "investigator": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "analyst": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "court": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F0F4F8] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-[#1F2937] flex flex-col z-20">
        {/* Brand */}
        <div className="p-6 border-b border-[#1F2937] flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-cyan-400 animate-pulse" />
          <div>
            <h1 className="font-tech font-bold text-lg tracking-wider text-cyan-400 leading-tight">PROOFSHIELD</h1>
            <span className="text-[10px] text-cyber-muted tracking-widest font-mono">TAMPER DETECT</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-6 bg-[#151B2C]/80 border border-[#1F2937] rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-5 h-5 text-cyber-muted" />
            <div className="truncate">
              <p className="text-xs font-semibold text-cyan-100 truncate">{user?.name}</p>
              <span className={`text-[9px] uppercase tracking-wider font-mono border rounded px-1.5 py-0.5 inline-block ${getRoleBadgeColor(user?.role)}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-800">
            <span className="text-[10px] block text-cyber-muted font-mono truncate" title={user?.walletAddress}>
              SYS ADDR: {user?.walletAddress ? `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(36)}` : "None"}
            </span>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (!item.roles.includes(user?.role)) return null;
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all ${
                  isActive 
                    ? "bg-[#1F2937] text-cyan-400 border-l-4 border-cyan-400 font-semibold" 
                    : "text-gray-400 hover:bg-[#151B2C]/50 hover:text-cyan-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-[#1F2937]">
          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full px-4 py-2.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 rounded-lg text-sm font-medium transition-all"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs text-cyber-muted tracking-wider font-mono">NODE STATUS: CONNECTED (LOCAL NODE)</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-cyber-muted block uppercase">Blockchain Network</span>
              <span className="text-xs font-mono font-semibold text-emerald-400">Hardhat Node (1337)</span>
            </div>
            <div className="h-8 w-px bg-gray-800"></div>
            <div>
              <span className="text-[10px] text-cyber-muted block uppercase">Secured Elements</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">AES-256 / SHA-256</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0B0F19]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
