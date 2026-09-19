import React from "react";

const ROLE_PERMISSIONS = {
  admin: [
    "View all dashboards and operational KPIs",
    "Manage products, suppliers, orders, and warehouses",
    "Create, edit, and deactivate users",
    "Access audit logs and system reports",
    "Control role-based permissions and access policies",
  ],
  manager: [
    "View operational dashboards and inventory health",
    "Manage products, suppliers, and warehouse stock",
    "Approve and track purchase and sales orders",
    "Review movement history and reports",
    "Access team-level planning and operational insights",
  ],
  staff: [
    "View assigned dashboard and inventory data",
    "Track product availability and warehouse state",
    "Review incoming and outgoing movements",
    "Use AI assistant for planning suggestions",
    "View limited reporting and operational summaries",
  ],
};

const PermissionsModal = ({ user, onClose }) => {
  const role = user?.role || "staff";
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-lg rounded-xl border border-[#1E232E] bg-[#0D1322] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1E232E] bg-[#0E1015] px-5 py-3.5">
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              Role Permissions
            </h2>
            <p className="text-[11px] text-gray-400">
              Access matrix for {user?.name || "current user"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close permissions modal"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between rounded-md border border-[#1E232E] bg-[#111827] px-3 py-2">
            <span className="text-[11px] text-gray-400">Current role</span>
            <span className="rounded border border-emerald-800 bg-[#064E3B] px-2 py-0.5 text-[10px] font-medium capitalize text-emerald-300">
              {role}
            </span>
          </div>

          <ul className="space-y-2 text-[12px] text-gray-200">
            {permissions.map((permission, index) => (
              <li
                key={index}
                className="flex items-start gap-2 rounded bg-[#111827] px-3 py-2 border border-[#1E232E]"
              >
                <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{permission}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;
