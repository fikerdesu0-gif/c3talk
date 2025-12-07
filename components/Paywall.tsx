import React, { useState } from 'react';
import { Check, Star, Send, LogIn, Lock, X } from 'lucide-react';
import { Language } from '../types';

interface PaywallProps {
    language: Language;
    onLoginClick: () => void;
    onClose?: () => void;
}

const ADMIN_WHATSAPP_NUMBER = '251970692215';

export const Paywall: React.FC<PaywallProps> = ({ language, onLoginClick, onClose }) => {
    const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const ORIGINAL_YEARLY_FROM_MONTHLY = 12 * 19;
    const CURRENT_YEARLY_PRICE = 133;
    const savingsPercent = Math.round(((ORIGINAL_YEARLY_FROM_MONTHLY - CURRENT_YEARLY_PRICE) / ORIGINAL_YEARLY_FROM_MONTHLY) * 100);

    const handlePurchase = (e: React.FormEvent) => {
        e.preventDefault();

        const message = language === Language.AMHARIC
            ? `ሰላም፣ C3TALK የአመት ዕቅድ ለመግዛት እፈልጋለሁ።\n\nስም: ${fullName}\nስልክ: ${phoneNumber}\nዋጋ: 133 AED/አመት`
            : `Akkam, karoora waggaa C3TALK bituuf barbaada.\n\nMaqaa: ${fullName}\nLakkoofsa bilbila: ${phoneNumber}\nGatii: 133 AED/waggaa`;

        const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const benefits = [
        language === Language.AMHARIC
            ? 'በየወሩ ለ12 ወር 100 የድምጽ ትርጉም ክሬዲት'
            : language === Language.OROMO
            ? 'Ji’a 12f krediiitii hiika sagalee 100 argatta'
            : 'Get 100 voice-translation credits every month for 12 months.',
        language === Language.AMHARIC
            ? 'ሙሉ የ ጽሑፍ ትርጉም'
            : language === Language.OROMO
            ? 'Hiika guutuu barruu'
            : 'No Ads',
        language === Language.AMHARIC
            ? '24/7 ድጋፍ'
            : language === Language.OROMO
            ? '24/7 deeggarsa'
            : 'Priority Support',
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-y-auto">
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    {onClose && (
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    )}
                    <div className="w-16 h-16 bg-[#E50914] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(229,9,20,0.5)]">
                        <Star fill="white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold">
                        {language === Language.AMHARIC ? 'ፕሪሚየም ይሁኑ' : 'Go Premium'}
                    </h1>
                    <p className="text-neutral-400">
                        {language === Language.AMHARIC ? 'ሙሉ አቅሙን ይጠቀሙ' : 'Unlock full potential'}
                    </p>
                </div>

                <div className="w-full max-w-md space-y-4">
                    <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 opacity-50 flex justify-between items-center cursor-not-allowed">
                        <div>
                            <div className="font-bold text-neutral-400">Monthly</div>
                            <div className="text-sm text-neutral-500">19 AED / month</div>
                        </div>
                        <Lock size={20} className="text-neutral-500" />
                    </div>

                    <div className="relative p-1 rounded-2xl bg-gradient-to-r from-[#E50914] to-orange-600">
                        <div className="absolute -top-3 right-3 bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                            {language === Language.AMHARIC ? 'ለመጀመሪያ 25 ሰዎች ብቻ የልዩ ዋጋ' : language === Language.OROMO ? 'Namoota 25 jalqabaa qofatti gatii addaa' : 'Special price for the first 25 people only'}
                        </div>
                        <div className="bg-neutral-900 p-5 rounded-xl flex justify-between items-center">
                            <div>
                                <div className="font-bold text-xl">{language === Language.AMHARIC ? 'የአመት ክፍያ' : language === Language.OROMO ? 'Karoora waggaa' : 'Yearly'}</div>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm text-neutral-400">{CURRENT_YEARLY_PRICE} AED / {language === Language.AMHARIC ? 'አመት' : language === Language.OROMO ? 'waggaa' : 'year'}</div>
                                    <div className="text-xs text-neutral-500 line-through">{ORIGINAL_YEARLY_FROM_MONTHLY} AED</div>
                                </div>
                                
                                <div className="text-xs text-green-400 mt-1">{language === Language.AMHARIC ? `ቆጥብ ${savingsPercent}%` : language === Language.OROMO ? `Garaagarummaa ${savingsPercent}%` : `Save ${savingsPercent}%`}</div>
                            </div>
                            <div className="w-6 h-6 bg-[#E50914] rounded-full flex items-center justify-center">
                                <Check size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="space-y-3 w-full max-w-md">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-3 text-neutral-300">
                            <Check size={18} className="text-[#E50914]" />
                            <span>{benefit}</span>
                        </div>
                    ))}
                </div>

                {/* Purchase Form */}
                <form onSubmit={handlePurchase} className="w-full max-w-md space-y-4 pt-4 border-t border-neutral-800">
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Full Name"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#E50914] outline-none"
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#E50914] outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Send size={20} />
                        {language === Language.AMHARIC ? 'በWhatsApp' : language === Language.OROMO ? 'Ergaa WhatsAppiin ergi' : 'Request via WhatsApp'}
                    </button>
                </form>

                {/* Login Link */}
                <button
                    onClick={onLoginClick}
                    className="text-neutral-500 hover:text-white flex items-center gap-2 text-sm"
                >
                    <LogIn size={16} />
                    Already have a subscription? Login
                </button>
            </div>
        </div>
    );
};
