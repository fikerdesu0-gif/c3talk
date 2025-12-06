import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Loader2, Phone, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !password) {
      setError('Please enter both phone number and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Map phone number to email for Firebase Auth
      // Remove spaces and special chars for the email part
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const email = `${cleanPhone}@c3talk.com`;

      await signInWithEmailAndPassword(auth, email, password);
      // App.tsx handles the auth state change
    } catch (err: any) {
      console.error("Login Error:", err);
      let msg = 'Failed to login.';
      if (err.code === 'auth/invalid-email') msg = 'Invalid phone number format.';
      else if (err.code === 'auth/user-not-found') msg = 'No account found. Please purchase a subscription first.';
      else if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      else if (err.code === 'auth/invalid-credential') msg = 'Invalid credentials.';

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-black text-white relative">

      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-8 left-8 text-neutral-400 hover:text-white p-2"
        >
          <ArrowLeft size={24} />
        </button>
      )}

      <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500 max-w-sm w-full">

        <div className="flex justify-center">
          <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center text-[#E50914] shadow-2xl">
            <Lock size={32} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Subscriber Login</h1>
          <p className="text-neutral-500">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 w-full">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 pl-12 text-lg text-white placeholder:text-neutral-600 outline-none focus:border-[#E50914] transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 pl-12 text-lg text-white placeholder:text-neutral-600 outline-none focus:border-[#E50914] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#E50914] text-white rounded-2xl font-bold shadow-[0_0_20px_rgba(229,9,20,0.3)] hover:bg-[#b8070f] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <span>Login</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="text-red-500 text-sm bg-red-900/10 p-4 rounded-xl border border-red-900/30 flex items-start gap-2 text-left animate-in slide-in-from-bottom-2">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{error}</span>
          </div>
        )}

      </div>
    </div>
  );
};