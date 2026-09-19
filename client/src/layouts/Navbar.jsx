import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, LogOut, User, Shield, ShieldCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { logout } from '../../app/slices/authSlice';
import { fetchNotifications } from '../../app/slices/analyticsSlice';
import PermissionsModal from '../common/PermissionsModal';

const pageMeta = {
  '/dashboard': { section: 'Operations', title: 'Operational Overview' },
  '/products': { section: 'Inventory', title: 'Item Master & Stock Ledger' },
  '/warehouses': { section: 'Logistics', title: 'Warehouse Facilities' },
  '/suppliers': { section: 'Procurement', title: 'Supplier Directory' },
  '/orders': { section: 'Operations', title: 'Purchase & Sales Orders' },
  '/audit-log': { section: 'Audit', title: 'Stock Movement Ledger' },
  '/ai-assistant': { section: 'Planning', title: 'Demand Forecasting & Reorders' },
  '/reports': { section: 'Reporting', title: 'Valuation & Audit Reports' },
  '/users': { section: 'Administration', title: 'User Access Control' },
};

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { notifications, unreadCount } = useSelector((s) => s.analytics);

  const [showNotif, setShowNotif] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const notifRef = useRef(null);

  const currentMeta = pageMeta[location.pathname] || { section: 'System', title: 'RetailPulse' };

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getNotifIcon = (type) => {
    if (type === 'out_of_stock') return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    if (type === 'low_stock') return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    return <Info className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <header className="h-[49.5px] flex items-center justify-between px-5 bg-[#0D1322] border-b border-[#1E293B] select-none">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2 text-[12.5px]">
        <span className="text-gray-400 font-medium text-xs">{currentMeta.section}</span>
        <span className="text-gray-600">/</span>
        <h1 className="font-semibold text-gray-200 tracking-tight">{currentMeta.title}</h1>
      </div>

      {/* Global Quick Search (Linear / Stripe style) */}
      <div className="hidden md:flex items-center w-[18.5rem] h-[33px] px-2.5 bg-[#0B1020] border border-[#1E293B] rounded-md text-gray-400 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
        <Search className="w-3.5 h-3.5 text-gray-500 mr-2 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search items, SKU, PO..."
          className="w-full bg-transparent text-xs text-gray-200 placeholder-gray-500 outline-none"
        />
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-[#131C33] border border-[#1E293B] rounded">
          ⌘K
        </kbd>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-3">
        {/* System Online Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-[#0C1F18] text-emerald-400 border border-emerald-900 border-opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Online</span>
        </div>

        {/* Role Pill + Permissions Icon */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize bg-[#131C33] text-gray-300 border border-[#1E293B]">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>{user?.role}</span>
          </div>
          <button
            id="navbar-permissions-btn"
            onClick={() => setShowPermissions(true)}
            className="p-1 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-[#0C1F18] border border-transparent hover:border-emerald-800/60 transition-colors"
            title={`View ${user?.role} permissions`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-[#131C33] border border-transparent hover:border-[#1E293B] relative transition-colors"
            id="notifications-button"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute 0.5 0.5 -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold font-mono flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-1.5 w-80 saas-card overflow-hidden z-50 shadow-2xl">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#1E232E] bg-[#0E1015]">
                <span className="text-xs font-semibold text-gray-200">Alerts & System Logs</span>
                {unreadCount > 0 && (
                  <span className="badge-danger font-mono text-[10px]">{unreadCount} unread</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#181B23]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-xs">No pending notifications</div>
                ) : (
                  notifications.slice(0, 8).map((n, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 hover:bg-[#171A22] transition-colors">
                      <div className="mt-0.5 flex-shrink-0">{getNotifIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 leading-snug">{n.title}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{n.message}</p>
                      </div>
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Global Permissions Modal — accessible by all roles */}
      {showPermissions && (
        <PermissionsModal
          user={user}
          onClose={() => setShowPermissions(false)}
        />
      )}
    </header>
  );
};

export default Navbar;

