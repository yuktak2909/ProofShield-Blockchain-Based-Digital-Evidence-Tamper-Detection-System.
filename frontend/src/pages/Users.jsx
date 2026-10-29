import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users as UsersIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertCircle,
  ShieldAlert,
  Wallet,
  X
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
    setPassword(""); // Leave blank
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
        if (password) payload.password = password; // Only update pass if entered
        await axios.patch(`/api/admin/users/${editId}`, payload);
        setSuccess("User account updated successfully.");
      } else {
        await axios.post("/api/admin/users", {
          name,
          email,
          password,
          role,
          walletAddress
        });
        setSuccess("User account created successfully.");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "User transaction failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This will revoke all node permissions.")) return;
    setError("");
    setSuccess("");
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setSuccess("User account deleted successfully.");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user account.");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "investigator": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "analyst": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "court": return "bg-green-500/10 text-green-400 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-tech font-bold text-cyan-400 tracking-wide">NODE ACCESS MANAGEMENT</h2>
          <p className="text-xs text-cyber-muted">Manage system authentication profiles, roles, and connected crypto keys.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg text-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create User Account
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
          {success}
        </div>
      )}

      {/* Users Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs">
          <div className="w-8 h-8 border-3 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mb-3"></div>
          SYNCING USER ACCOUNTS...
        </div>
      ) : (
        <div className="bg-[#151B2C]/30 border border-[#1F2937] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-[#111827]/40 text-cyber-muted uppercase tracking-wider">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Security Email</th>
                  <th className="py-3.5 px-6">Role Clearance</th>
                  <th className="py-3.5 px-6">Cryptographic Wallet Address</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#151B2C]/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-cyan-100">{u.name}</td>
                    <td className="py-4 px-6 text-gray-300 font-mono">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold border ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-cyber-muted font-mono" title={u.walletAddress}>
                      {u.walletAddress ? (
                        <span className="flex items-center gap-1.5 text-cyan-200">
                          <Wallet className="w-3.5 h-3.5 text-cyber-muted" />
                          {u.walletAddress}
                        </span>
                      ) : (
                        "None Set"
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 bg-[#151B2C] hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 border border-gray-800 rounded transition-all cursor-pointer inline-block"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-500/20 text-red-400 border border-red-950/30 rounded transition-all cursor-pointer inline-block"
                        title="Delete User"
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
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-cyber-muted hover:text-cyan-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-tech text-base font-bold text-cyan-400 mb-2 uppercase flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-cyan-400" />
              {isEditing ? "Modify Clearance Profile" : "Create Security Profile"}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Clearance permissions and Ethereum blockchain keys will map to this identity structure.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Clearance Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alice Jones"
                    className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Clearance Level / Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                    required
                  >
                    <option value="investigator">Investigator</option>
                    <option value="analyst">Forensic Analyst</option>
                    <option value="court">Court Official</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Security Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@proofshield.com"
                    className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">
                    Passkey {isEditing && "(Leave blank to keep current password)"}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-4 py-2.5 text-xs text-gray-100 focus:outline-none"
                    required={!isEditing}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-cyber-muted font-semibold uppercase block mb-1">Ethereum Wallet Address (Hex)</label>
                  <div className="relative">
                    <Wallet className="absolute left-3.5 top-3 w-4 h-4 text-cyber-muted" />
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-[#151B2C] border border-[#1F2937] focus:border-cyan-400 rounded-lg pl-10 pr-4 py-2.5 text-xs text-gray-100 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-800 hover:bg-gray-800 rounded-lg text-xs font-semibold text-cyber-muted hover:text-gray-100"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg text-xs tracking-wide flex items-center gap-1.5"
                >
                  {formLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    isEditing ? "Save Profile" : "Register User"
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
