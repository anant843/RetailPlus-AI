import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "../app/slices/authSlice";
import { authAPI } from "../services/api";
import {
  Users as UsersIcon,
  Plus,
  Edit2,
  Shield,
  ShieldCheck,
  X,
  CheckCircle2,
} from "lucide-react";
import PermissionsModal from "../common/PermissionsModal";

const UserModal = ({ user, onClose, onSubmit, loading }) => {
  const isEdit = !!user;
  const [form, setForm] = useState(
    user
      ? {
          role: user.role,
          isActive: user.isActive,
          name: user.name,
          department: user.department,
        }
      : {
          name: "",
          email: "",
          password: "",
          role: "staff",
          department: "",
          phone: "",
        },
  );

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content max-w-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E232E] bg-[#0E1015]">
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              {isEdit ? `Edit User: ${user?.name}` : "Create New System User"}
            </h2>
            <p className="text-[11px] text-gray-400">
              RBAC credential and authorization provisioning
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="p-5 space-y-3.5"
        >
          {!isEdit && (
            <>
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jonathan Drake"
                  required
                />
              </div>
              <div>
                <label className="form-label">Corporate Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jdrake@retailflow.com"
                  required
                />
              </div>
              <div>
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </>
          )}

          {isEdit && (
            <div>
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="form-label">Assigned Role *</label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Admin (Root System Authority)</option>
              <option value="manager">Manager (Operations & Inventory)</option>
              <option value="staff">Staff (Fulfillment & Read-Only)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Department</label>
            <input
              className="form-input"
              value={form.department || ""}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Supply Chain & Logistics"
            />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between p-2.5 rounded bg-[#0E1015] border border-[#1E232E]">
              <span className="text-xs text-gray-300">Account Active</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                  form.isActive
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : "bg-rose-950 text-rose-300 border border-rose-800"
                }`}
              >
                {form.isActive ? "Active" : "Deactivated"}
              </button>
            </div>
          )}

          <div className="flex gap-2.5 pt-2 border-t border-[#1E232E]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Provision User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Users = () => {
  const dispatch = useDispatch();
  const { users, user: currentUser } = useSelector((s) => s.auth);
  const [modal, setModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [permissionsModal, setPermissionsModal] = useState(false);
  const [selectedPermUser, setSelectedPermUser] = useState(null);

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const handleSubmit = async (form) => {
    setSubmitLoading(true);
    try {
      if (editUser) {
        await authAPI.updateUser(editUser._id, form);
      } else {
        await authAPI.register(form);
      }
      dispatch(getUsers());
      setModal(false);
      setEditUser(null);
    } catch (e) {
      console.error(e);
    }
    setSubmitLoading(false);
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E232E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              User Accounts & Permissions
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#171A22] text-gray-400 border border-[#232834]">
              {users.length} active accounts
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Role-based permissions (Admin, Manager, Staff), access control, and
            user account status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="rbac-permissions-matrix-btn"
            onClick={() => {
              setSelectedPermUser(currentUser);
              setPermissionsModal(true);
            }}
            className="btn-secondary"
            title="View Role-Based Access Control (RBAC) Permissions"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>RBAC Permissions</span>
          </button>

          <button
            onClick={() => {
              setEditUser(null);
              setModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Grid of Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {users.map((u) => (
          <div
            key={u._id}
            className={`saas-card p-3.5 space-y-2.5 ${
              u._id === currentUser?.id
                ? "border-emerald-800 border-opacity-70"
                : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#1C202A] border border-[#2B3242] flex items-center justify-center text-xs font-semibold text-gray-200">
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-semibold text-white">
                      {u.name}
                    </h3>
                    {u._id === currentUser?.id && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#064E3B] bg-opacity-40 text-emerald-300 border border-emerald-800">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedPermUser(u);
                    setPermissionsModal(true);
                  }}
                  className="btn-icon"
                  title={`Inspect permissions for ${u.name} (${u.role})`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400 hover:text-emerald-400 transition-colors" />
                </button>

                {u._id !== currentUser?.id && (
                  <button
                    onClick={() => {
                      setEditUser(u);
                      setModal(true);
                    }}
                    className="btn-icon"
                    title="Edit user"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded bg-[#11221A] text-emerald-300 border border-[#1A402E]">
                {u.role}
              </span>
              <span className={u.isActive ? "badge-success" : "badge-gray"}>
                {u.isActive ? "Active" : "Deactivated"}
              </span>
            </div>

            <div className="pt-2 border-t border-[#1E232E] flex items-center justify-between text-[11px] text-gray-400">
              <span>{u.department || "General Ops"}</span>
              <span>
                {u.lastLogin
                  ? `Active ${new Date(u.lastLogin).toLocaleDateString()}`
                  : "Pending first login"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <UserModal
          user={editUser}
          onClose={() => {
            setModal(false);
            setEditUser(null);
          }}
          onSubmit={handleSubmit}
          loading={submitLoading}
        />
      )}

      {permissionsModal && (
        <PermissionsModal
          user={selectedPermUser || currentUser}
          onClose={() => {
            setPermissionsModal(false);
            setSelectedPermUser(null);
          }}
        />
      )}
    </div>
  );
};

export default Users;
