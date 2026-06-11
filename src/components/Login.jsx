import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { Mail, Lock, ArrowRight, Droplets, AlertCircle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance'; // Import real API

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Error state
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Asli Backend par Request bhej rahe hain
      const response = await axiosInstance.post('/auth/login', {
        identifier: email,
        password: password
      });

      // API Response check karna
      if (response.data && response.data.success) {
        dispatch(
          loginSuccess({
            user: response.data.data,
            token: response.data.token,
          })
        );
      } else {
        // Agar success false ho ya koi error aaye
        setError(response.data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Network error ya 400/500 error aaye
      setError(err.response?.data?.message || 'Something went wrong. Please check your network or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 font-sans">
      {/* Animated Glowing Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-emerald-500 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[50rem] h-[20rem] bg-indigo-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>

      {/* Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md p-10 backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)] mb-5 transform transition-all duration-500 hover:scale-110 hover:rotate-6">
            <Droplets className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-300 to-emerald-400">
            Petro Coin
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-light">Secure Access Portal</p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner"
                placeholder="admin@gmail.com"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</a>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl text-white font-medium text-base tracking-wide bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {/* Button Shine/Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
            
            <span className="relative flex items-center gap-2">
              {isLoading ? 'Authenticating...' : 'Secure Sign In'}
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
