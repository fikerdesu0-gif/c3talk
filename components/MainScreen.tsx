import React, { useState } from 'react';
import { Language } from '../types';
import { BottomNavigation, TabType } from './BottomNavigation';
import { HomeTab } from './HomeTab';
import { History } from './History';
import { Settings } from './Settings';

interface MainScreenProps {
    language: Language;
    onVoiceClick: () => void;
    onTextClick: () => void;
    onLanguageChange: () => void;
    installPrompt: any;
    onInstallClick: () => void;
    credits: number | null;
}

export const MainScreen: React.FC<MainScreenProps> = ({
    language,
    onVoiceClick,
    onTextClick,
    onLanguageChange,
    installPrompt,
    onInstallClick,
    credits,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('home');

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* Tab Content */}
            <div className="flex-1">
                {activeTab === 'home' && (
                    <HomeTab
                        language={language}
                        onVoiceClick={onVoiceClick}
                        onTextClick={onTextClick}
                        credits={credits}
                    />
                )}
                {activeTab === 'history' && <History />}
                {activeTab === 'settings' && (
                    <Settings
                        language={language}
                        onLanguageChange={onLanguageChange}
                        installPrompt={installPrompt}
                        onInstallClick={onInstallClick}
                        credits={credits}
                    />
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};
