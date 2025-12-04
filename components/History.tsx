import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Header } from './Header';
import { Loader2, MessageSquare, Mic } from 'lucide-react';

interface HistoryItem {
    id: string;
    type: 'audio' | 'text' | 'reply';
    sourceLanguage: string;
    targetLanguage: string;
    original: string;
    translated: string;
    timestamp: any;
}

interface HistoryProps {
    onBack: () => void;
}

export const History: React.FC<HistoryProps> = ({ onBack }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!auth.currentUser) return;

            try {
                const q = query(
                    collection(db, 'translations'),
                    where('userId', '==', auth.currentUser.uid),
                    orderBy('timestamp', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const items: HistoryItem[] = [];
                querySnapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() } as HistoryItem);
                });
                setHistory(items);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return (
        <div className="flex-1 flex flex-col bg-black text-white">
            <Header title="History" onBack={onBack} />

            <div className="flex-1 overflow-y-auto p-6 pb-12 fade-in">
                {loading ? (
                    <div className="flex items-center justify-center h-[50vh]">
                        <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-500 space-y-4">
                        <MessageSquare size={48} />
                        <p>No history found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                                    <div className="flex items-center gap-2">
                                        {item.type === 'audio' ? <Mic size={14} /> : <MessageSquare size={14} />}
                                        <span>{item.type}</span>
                                    </div>
                                    <span>{item.timestamp?.toDate().toLocaleDateString()}</span>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-neutral-400 text-sm line-clamp-2">{item.original}</p>
                                    <div className="h-px bg-neutral-800 my-2" />
                                    <p className="text-white font-medium text-lg">{item.translated}</p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-neutral-600">
                                    <span>{item.sourceLanguage}</span>
                                    <span>→</span>
                                    <span className="text-[#E50914]">{item.targetLanguage}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
