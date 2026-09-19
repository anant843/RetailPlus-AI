import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../app/slices/authSlice';
import {
  LayoutDashboard, Package, Warehouse, Truck, ShoppingCart,
  ClipboardList, Bot, BarChart3, Users, ChevronLeft, ChevronRight,
  Layers, LogOut
} from 'lucide-react';

const navGroups = [
  {
    title: 'OPERATIONS',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'staff'] },
      { to: '/products', icon: Package, label: 'Products', roles: ['admin', 'manager', 'staff'] },
      { to: '/warehouses', icon: Warehouse, label: 'Warehouses', roles: ['admin', 'manager', 'staff'] },
      { to: '/orders', icon: ShoppingCart, label: 'Orders', roles: ['admin', 'manager', 'staff'] },
    ]
  },
  {
    title: 'SUPPLY CHAIN',
    items: [
      { to: '/suppliers', icon: Truck, label: 'Suppliers', roles: ['admin', 'manager'] },
      { to: '/audit-log', icon: ClipboardList, label: 'Audit Log', roles: ['admin', 'manager'] },
    ]
  },
  {
    title: 'ANALYTICS & PLANNING',
    items: [
      { to: '/ai-assistant', icon: Bot, label: 'Demand Planning', roles: ['admin', 'manager', 'staff'], badge: 'AI' },
      { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager'] },
    ]
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { to: '/users', icon: Users, label: 'User Roles', roles: ['admin'] },
    ]
  }
];

const Sidebar = ({ collapsed, onToggle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-[width] duration-200 ease-out select-none bg-[#0D1322] border-r border-[#1E293B] ${
        collapsed ? 'w-16 overflow-visible' : 'w-[13rem] overflow-hidden'
      }`}
    >
      {/* Header / Brand Logo */}
      <div className={`flex items-center pt-3 pb-2.5 px-3 border-b border-[#1E293B] ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm">
            <Layers className="w-3.5 h-3.5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-xs font-semibold tracking-tight text-white block leading-tight">
                RetailPulse
              </span>
              <p className="text-[9px] text-gray-400 font-medium leading-tight mt-0.5">Inventory & Hubs</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-[#131C33] transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <div className={`flex-1 py-3 px-2 ${collapsed ? 'overflow-visible space-y-4' : 'overflow-y-auto space-y-3'}`}>
        {navGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(user?.role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className={collapsed ? 'space-y-1.5' : 'space-y-0.5'}>
              {!collapsed && (
                <div className="px-2 pb-1 text-[8.5px] font-semibold text-gray-500/50 uppercase tracking-widest select-none">
                  {group.title}
                </div>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link group ${isActive ? 'active' : ''} ${collapsed ? 'justify-center !px-1.5 !border-l-0 !rounded-md' : ''}`
                  }
                >
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-medium bg-[#064E3B] text-emerald-300 border border-emerald-800 border-opacity-60">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* High-Precision Floating Tooltip in Collapsed Mode */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F1629] text-gray-100 text-[11px] font-medium border border-[#1E293B] shadow-2xl whitespace-nowrap pointer-events-none z-50">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1 py-0.2 rounded text-[8.5px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                          {item.badge}
                        </span>
                      )}
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0F1629] border-l border-b border-[#1E293B] rotate-45" />
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      {/* Toggle Button for collapsed mode */}
      {collapsed && (
        <div className="p-2 border-t border-[#1E293B] flex justify-center">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#131C33] transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Simplified User Footer Profile */}
      <div className="p-2 border-t border-[#1E293B]/70 bg-[#0B1020]">
        <div
          className={`flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-[#131C33]/50 transition-colors cursor-default ${
            collapsed ? 'justify-center' : ''
          }`}
          title={user?.email ? `${user?.name} (${user?.email})` : user?.name}
        >
          <div className="w-6 h-6 rounded-md bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[11px] font-semibold text-gray-200 flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0 flex-1 flex items-center justify-between gap-1.5">
              <p className="text-[11.5px] font-medium text-gray-200 truncate">{user?.name}</p>
              <span className="text-[9px] font-medium capitalize px-1.5 py-0.2 rounded bg-[#131C33] text-emerald-400/90 border border-[#1E293B] flex-shrink-0">
                {user?.role}
              </span>
            </div>
          )}
        </div>

        {/* Sign Out */}
        {!collapsed ? (
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="w-full mt-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-[11px] font-medium cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        ) : (
          <div className="mt-1 flex justify-center">
            <button
              id="sidebar-logout-btn-collapsed"
              onClick={handleLogout}
              className="w-7 h-7 flex items-center justify-center rounded-md text-rose-400/70 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
