import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertCircle,
  ShieldCheck,
  Wallet,
  X,
  CheckCircle2
} from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  
  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("investigator");
  const [walletAddress, setWalletAddress] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/admin/users");
      setUsers(response.data);
    } catch (err) {
      setError("Failed to fetch system user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditId("");
    setName("");
    setEmail("");
    setPassword("");
    setRole("investigator");
    setWalletAddress("");
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setEditId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setWalletAddress(user.walletAddress || "");
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");
    try {
      if (isEditing) {
        const payload = { name, email, role, walletAddress };
        if (password) payload.password = password;
        await axios.patch(`/api/admin/users/${editId}`, payload);
        setSuccess("User identity updated successfully.");
      } else {
        await axios.post("/api/admin/users", {
          name,
          email,
          password,
          role,
          walletAddress
        });
        setSuccess("New agency profile registered successfully.");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "User operation failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to revoke node clearance for this user?")) return;
    setError("");
    setSuccess("");
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setSuccess("User account access revoked.");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user profile.");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin": 
        return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">Administrator</span>;
      case "investigator": 
        return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-[#F2E2E7] text-[#873D50] border border-[#E5C3CD]">Investigator</span>;
      case "analyst": 
        return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-[#F9F5FF] text-[#6941C6] border border-[#E9D7FE]">Forensic Analyst</span>;
      case "court": 
        return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-[#EDFDF5] text-[#087443] border border-[#A6F4C5]">Judicial Official</span>;
      default: 
        return <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-[#FAF8F7] text-[#57515A] border border-[#E8E4E1]">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E4E1] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#343239]">Node Clearance & Identity Management</h1>
          <p className="text-xs text-[#57515A]">Manage investigator credentials, judicial roles, and connected Ethereum wallet addresses.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#873D50] hover:bg-[#732F40] text-white font-semibold rounded-lg text-sm transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Authorized User
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Users Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-blue-700 font-medium text-xs">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mb-3"></div>
          Syncing authorized profiles...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Official Name</th>
                  <th className="py-3.5 px-6">Security Email</th>
                  <th className="py-3.5 px-6">Role Clearance</th>
                  <th className="py-3.5 px-6">Ethereum Custodian Address</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-4 px-6">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600" title={u.walletAddress}>
                      {u.walletAddress ? (
                        <span className="flex items-center gap-1.5 text-slate-800">
                          <Wallet className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-xs">{u.walletAddress}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No wallet configured</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer inline-block"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md transition-all cursor-pointer inline-block"
                        title="Revoke User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isEditing ? "Modify Personnel Clearance" : "Register Agency Profile"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Assign role clearances and cryptographic wallet addresses to this profile.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alice Jones"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Clearance Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                    required
                  >
                    <option value="investigator">Investigator</option>
                    <option value="analyst">Forensic Analyst</option>
                    <option value="court">Judicial Official</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Official Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@agency.gov"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">
                    Passkey {isEditing && "(Leave blank to keep existing password)"}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-4 py-2.5 text-xs text-slate-900 focus:outline-none"
                    required={!isEditing}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-700 font-semibold uppercase block mb-1">Ethereum Wallet Address (Hex)</label>
                  <div className="relative">
                    <Wallet className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs tracking-wide flex items-center gap-1.5 shadow-xs"
                >
                  {formLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    isEditing ? "Save Changes" : "Register Personnel"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
