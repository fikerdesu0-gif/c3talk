import React, { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, signInAnonymously } from "firebase/auth";
import { auth } from "../services/firebase";
import { Loader2, Phone, ArrowRight, ShieldCheck, AlertCircle, User } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use a Ref to store the verifier instance to avoid re-renders resetting it unexpectedly
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA on mount
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response: any) => {
            // reCAPTCHA solved - will automatically continue to signInWithPhoneNumber
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
      }
    } catch (err) {
      console.error("Recaptcha Init Error:", err);
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.error("Cleanup error", e);
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error("Security check not initialized. Please refresh.");
      }

      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      window.confirmationResult = confirmationResult;
      setStep('OTP');
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = 'Failed to send SMS.';
      
      if (err.code === 'auth/invalid-phone-number') msg = 'Invalid phone number format.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many requests. Please try again later.';
      else if (err.code === 'auth/internal-error') {
          msg = 'Internal Setup Error. Ensure this domain is authorized in Firebase Console.';
      }
      else if (err.code === 'auth/billing-not-enabled') {
          msg = 'SMS requires billing. Try "Continue as Guest" below.';
      }
      else if (err.message) msg = err.message;

      setError(msg);
      
      // If error occurs, we might need to reset recaptcha
      if (recaptchaVerifierRef.current) {
          try {
            // clear() might throw if not rendered, safe to ignore here
            recaptchaVerifierRef.current.clear(); 
            recaptchaVerifierRef.current = null;
            // Re-init happens on next effect or we can force reload
          } catch(e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) return;
    setLoading(true);
    setError('');
    
    try {
      if (!window.confirmationResult) throw new Error("No verification ID found");
      await window.confirmationResult.confirm(verificationCode);
      // App.tsx handles the auth state change
    } catch (err: any) {
      console.error(err);
      setError('Invalid code. Please try again.');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error("Guest Auth Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Enable "Anonymous" in Firebase Console > Authentication.');
      } else {
        setError('Guest login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-black text-white">
      {/* Invisible Recaptcha Container */}
      <div id="recaptcha-container"></div>

      <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500 max-w-sm w-full">
        
        <div className="flex justify-center">
            <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center text-[#E50914] shadow-2xl">
                {step === 'PHONE' ? <Phone size={32} /> : <ShieldCheck size={32} />}
            </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
             {step === 'PHONE' ? 'Welcome Back' : 'Verify Phone'}
          </h1>
          <p className="text-neutral-500">
             {step === 'PHONE' ? 'Enter your mobile number to login' : `Code sent to ${phoneNumber}`}
          </p>
        </div>

        {step === 'PHONE' ? (
            <div className="space-y-4 w-full">
                <input 
                    type="tel" 
                    placeholder="+251 911..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center text-lg text-white placeholder:text-neutral-600 outline-none focus:border-[#E50914] transition-colors"
                />
                 <button
                    onClick={handleSendCode}
                    disabled={loading}
                    className="w-full py-4 bg-[#E50914] text-white rounded-2xl font-bold shadow-[0_0_20px_rgba(229,9,20,0.3)] hover:bg-[#b8070f] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                           <span>Send Code</span>
                           <ArrowRight size={18} />
                        </>
                    )}
                </button>
                
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black px-2 text-neutral-500">Or continue with</span>
                    </div>
                </div>

                <button
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full py-4 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                    <User size={18} />
                    <span>Guest Mode</span>
                </button>
            </div>
        ) : (
            <div className="space-y-4 w-full">
                <input 
                    type="text" 
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center text-2xl tracking-[0.5em] text-white placeholder:text-neutral-700 outline-none focus:border-[#E50914] transition-colors"
                />
                 <button
                    onClick={handleVerifyCode}
                    disabled={loading}
                    className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Verify Code'}
                </button>
                 <button 
                    onClick={() => {
                        setStep('PHONE');
                        setVerificationCode('');
                        setError('');
                    }}
                    className="text-sm text-neutral-500 hover:text-white transition-colors"
                 >
                    Change Phone Number
                 </button>
            </div>
        )}

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