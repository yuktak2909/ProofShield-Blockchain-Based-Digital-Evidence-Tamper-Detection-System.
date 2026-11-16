import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProofShieldLogo from "../components/ProofShieldLogo";
import { 
  LogIn, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Scale, 
  Eye, 
  EyeOff, 
  AlertCircle,
  UserCheck
} from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please provide both an authorized email and authentication passkey.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your email and passkey.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setActiveRole(role.email);
    setEmail(role.email);
    setPassword("Password123");
    setError("");
    setLoading(true);
    try {
      await login(role.email, "Password123");
      navigate("/");
    } catch (err) {
      setError(err.message || "Demonstration authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    {
      id: "investigator",
      name: "Investigator Alice",
      role: "Investigator",
      email: "investigator@proofshield.com",
      desc: "Seize evidence, seal SHA-256 hashes & initiate custody handoffs",
      badgeClass: "bg-[#F2E2E7] text-[#873D50] border-[#E5C3CD]"
    },
    {
      id: "analyst",
      name: "Forensic Analyst Bob",
      role: "Analyst",
      email: "analyst@proofshield.com",
      desc: "Examine bit-streams, inspect metadata & run tamper audits",
      badgeClass: "bg-[#F9F5FF] text-[#6941C6] border-[#E9D7FE]"
    },
    {
      id: "court",
      name: "Court Officer Charles",
      role: "Judicial",
      email: "court@proofshield.com",
      desc: "Verify custody integrity & inspect FRE 902(13)/(14) certificates",
      badgeClass: "bg-[#EDFDF5] text-[#087443] border-[#A6F4C5]"
    },
    {
      id: "admin",
      name: "Administrator Dave",
      role: "Admin",
      email: "admin@proofshield.com",
      desc: "Node governance, role management & smart contract sync",
      badgeClass: "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F3F2] flex items-center justify-center p-4 sm:p-6 lg:p-8 text-[#343239]">
      <div className="w-full max-w-5xl bg-white border border-[#E8E4E1] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN: Institutional Branding & Cryptographic Pillars       */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 bg-[#343239] text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#2A282E]">
          <div>
            <div className="mb-6">
              <ProofShieldLogo variant="dark" size="lg" />
            </div>

            <p className="text-[#D3CFD6] text-sm leading-relaxed mb-8">
              ProofShield is an enterprise-grade digital evidence integrity and cryptographic chain of custody platform for law enforcement agencies, digital forensics units, and judicial tribunals.
            </p>

            {/* Cryptographic Pillars */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#403D46]/60 border border-[#4D4954]">
                <div className="w-8 h-8 rounded-lg bg-[#873D50]/30 border border-[#873D50]/60 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#F2E2E7]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                    FIPS 180-4 Verification
                  </h4>
                  <p className="text-[11px] text-[#A29CA6] leading-tight mt-0.5">
                    Immutable SHA-256 bit-stream cryptographic hashing seals exhibits against post-seizure tampering.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#403D46]/60 border border-[#4D4954]">
                <div className="w-8 h-8 rounded-lg bg-[#873D50]/30 border border-[#873D50]/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4 text-[#F2E2E7]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                    Ethereum Smart Contract
                  </h4>
                  <p className="text-[11px] text-[#A29CA6] leading-tight mt-0.5">
                    On-chain anchoring on Chain 1337 guarantees multi-party consensus and non-repudiation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#403D46]/60 border border-[#4D4954]">
                <div className="w-8 h-8 rounded-lg bg-[#873D50]/30 border border-[#873D50]/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-4 h-4 text-[#F2E2E7]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                    Judicial Admissibility
                  </h4>
                  <p className="text-[11px] text-[#A29CA6] leading-tight mt-0.5">
                    Compliance with FRE 902(13)/(14) & Bharatiya Sakshya Adhiniyam Sec 63 electronic records.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Health / Status Pill */}
          <div className="mt-8 pt-6 border-t border-[#403D46] flex items-center justify-between text-xs text-[#A29CA6]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse"></span>
              <span className="font-mono text-[11px]">Ledger Sync: Operational</span>
            </div>
            <span className="font-mono text-[11px] text-[#D3CFD6]">Chain ID 1337</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Authentication Portal & One-Click Role Selector     */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#343239] tracking-tight">
                Agency Portal Authentication
              </h2>
              <p className="text-xs sm:text-sm text-[#57515A] mt-1">
                Select a demonstration profile below for instant access, or enter your official passkey.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl flex items-start gap-3 text-[#B42318] text-xs font-medium animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B42318]" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {/* Demonstration Role Profiles (2x2 Grid) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#343239] font-mono">
                  Demonstration Role Access
                </span>
                <span className="text-[10px] text-[#8C8490] font-mono">1-Click Instant Login</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleQuickLogin(role)}
                    disabled={loading}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      activeRole === role.email
                        ? "bg-[#FAF2F5] border-[#873D50] ring-1 ring-[#873D50]"
                        : "bg-[#FAF8F7] hover:bg-[#FAF2F5] border-[#E8E4E1] hover:border-[#E5C3CD]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-[#343239] group-hover:text-[#873D50] truncate">
                          {role.name}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${role.badgeClass}`}>
                          {role.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#57515A] leading-tight line-clamp-2">
                        {role.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#E8E4E1]/80 flex items-center justify-between text-[10px]">
                      <span className="text-[#8C8490] font-mono truncate">{role.email}</span>
                      <span className="text-[#873D50] font-bold flex items-center gap-0.5 shrink-0 ml-1">
                        Login <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E4E1]"></div>
              </div>
              <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider text-[#8C8490] font-mono font-medium">
                Or Sign In With Agency Credentials
              </span>
            </div>

            {/* Manual Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#343239] font-bold uppercase tracking-wider block mb-1 font-mono">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8C8490]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investigator@proofshield.com"
                    className="w-full bg-white border border-[#DDD7D2] focus:border-[#873D50] focus:ring-2 focus:ring-[#873D50]/15 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none text-[#343239] transition-all placeholder:text-[#A29CA6]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#343239] font-bold uppercase tracking-wider block mb-1 font-mono">
                  Authentication Passkey
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8C8490]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter agency passkey"
                    className="w-full bg-white border border-[#DDD7D2] focus:border-[#873D50] focus:ring-2 focus:ring-[#873D50]/15 rounded-xl pl-10 pr-11 py-2.5 text-sm focus:outline-none text-[#343239] transition-all placeholder:text-[#A29CA6]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-3 text-[#8C8490] hover:text-[#343239] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#873D50] hover:bg-[#732F40] active:bg-[#612433] text-white py-3 px-4 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Cryptographic Credentials...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Evidence Portal</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Compliance Notice */}
          <div className="mt-8 pt-4 border-t border-[#F0ECE9] text-center text-[10px] text-[#8C8490]">
            ProofShield Cryptographic Evidence Management • Authorized Law Enforcement & Judicial Personnel Only
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
