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
}

export const MainScreen: React.FC<MainScreenProps> = ({
    language,
    onVoiceClick,
    onTextClick,
    onLanguageChange,
    installPrompt,
    onInstallClick,
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
                    />
                )}
                {activeTab === 'history' && <History />}
                {activeTab === 'settings' && (
                    <Settings
                        language={language}
                        onLanguageChange={onLanguageChange}
                        installPrompt={installPrompt}
                        onInstallClick={onInstallClick}
                    />
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};
