import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../app/slices/authSlice';
import {
  Layers, Eye, EyeOff, Lock, Mail, Shield, BarChart3,
  UserCheck, AlertCircle, Warehouse, TrendingUp, Truck, Check
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    description: 'Full administrative access',
    email: 'admin@retailflow.com',
    password: 'Admin@123',
    icon: Shield,
  },
  {
    role: 'Manager',
    description: 'Inventory & order management',
    email: 'manager@retailflow.com',
    password: 'Manager@123',
    icon: BarChart3,
  },
  {
    role: 'Staff',
    description: 'Fulfillment & stock tracking',
    email: 'staff@retailflow.com',
    password: 'Staff@123',
    icon: UserCheck,
  },
];

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const handleDemoLogin = async (account) => {
    setForm({ email: account.email, password: account.password });
    const result = await dispatch(login({ email: account.email, password: account.password }));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0B0C0E] text-[#F3F4F6] select-none">
      {/* ── Left Panel: Product Branding & Business Value ─────────────────── */}
      <div className="lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 lg:py-16 bg-[#0E1015] border-b lg:border-b-0 lg:border-r border-[#1E232E]">
        <div className="max-w-lg mx-auto w-full space-y-8">
          {/* Header & Logo */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight font-mono">RetailPulse</h1>
                <p className="text-xs text-gray-400 font-medium">Warehouse & Inventory Control</p>
              </div>
            </div>
          </div>

          {/* 3 Concise Operational Features */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#11221A] border border-[#1A402E] flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <Warehouse className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Multi-Warehouse Inventory</h2>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Track warehouse stock levels, bin allocations, and inter-facility transfers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#11221A] border border-[#1A402E] flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Demand Forecasting & Replenishment</h2>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Compute projected run-rates, safety stock levels, and automated reorder points.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#11221A] border border-[#1A402E] flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Supplier & Purchase Orders</h2>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Manage supplier lead times, purchase orders (PO), and stock receipts.
                </p>
              </div>
            </div>
          </div>

          {/* Compact Operational Dashboard Preview */}
          <div className="saas-card p-3.5 space-y-2.5 bg-[#13151B]">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E232E]">
              <span className="text-xs font-medium text-gray-400">
                Facility status overview
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Operational
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-[#0E1015] border border-[#1E232E]">
                <span className="text-[11px] text-gray-400 block">Active facilities</span>
                <span className="text-xs font-semibold text-white mt-0.5 block tabular-nums">3 Locations</span>
              </div>
              <div className="p-2 rounded bg-[#0E1015] border border-[#1E232E]">
                <span className="text-[11px] text-gray-400 block">Total SKUs</span>
                <span className="text-xs font-semibold text-white mt-0.5 block tabular-nums">1,420 Items</span>
              </div>
              <div className="p-2 rounded bg-[#0E1015] border border-[#1E232E]">
                <span className="text-[11px] text-gray-400 block">Order fill rate</span>
                <span className="text-xs font-semibold text-emerald-400 mt-0.5 block tabular-nums">99.2%</span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Central Distribution Hub</span>
                <span className="text-gray-300 font-medium tabular-nums">82% capacity</span>
              </div>
              <div className="w-full h-1.5 bg-[#1C202A] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[82%]" />
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-gray-500">
            Warehouse Operations Console · Single Sign-On Ready
          </div>
        </div>
      </div>

      {/* ── Right Panel: Authentication Form ─────────────────────────────── */}
      <div className="lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 py-12 bg-[#0B0C0E]">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Sign In</h2>
            <p className="text-xs text-gray-400 mt-1">
              Enter your credentials to access the inventory system
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="email-input">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  id="email-input"
                  className="form-input pl-9"
                  placeholder="operator@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password-input"
                  className="form-input pl-9 pr-9"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#0E1015] border border-[#232834] text-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              id="login-button"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-medium"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Accounts Section */}
          <div className="pt-4 border-t border-[#1E232E] space-y-2.5">
            <p className="text-xs font-medium text-gray-400">
              Demo Accounts
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  id={`demo-${acc.role.toLowerCase()}`}
                  onClick={() => handleDemoLogin(acc)}
                  disabled={loading}
                  className="w-full p-2.5 rounded-lg bg-[#13151B] border border-[#232834] hover:border-[#384256] hover:bg-[#171A22] transition-colors text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded bg-[#11221A] border border-[#1A402E] flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <acc.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-200 group-hover:text-white">
                          {acc.role}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          ({acc.email})
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {acc.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-gray-500 group-hover:text-emerald-400 ml-2 flex-shrink-0">
                    Select →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
