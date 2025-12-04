import React from 'react';
import { Home, History, Settings } from 'lucide-react';

export type TabType = 'home' | 'history' | 'settings';

interface BottomNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'home' as TabType, icon: Home, label: 'Home' },
        { id: 'history' as TabType, icon: History, label: 'History' },
        { id: 'settings' as TabType, icon: Settings, label: 'Settings' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom z-50">
            <div className="flex items-center justify-around h-20 px-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'text-[#E50914] scale-105'
                                    : 'text-neutral-500 hover:text-white active:scale-95'
                                }`}
                        >
                            <Icon
                                size={24}
                                className={`transition-all duration-300 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`}
                            />
                            <span className={`text-xs font-semibold tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
