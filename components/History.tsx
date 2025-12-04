import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Header } from './Header';
import { Loader2, MessageSquare, Mic, Trash2, AlertTriangle } from 'lucide-react';

interface HistoryItem {
    id: string;
    type: 'audio' | 'text' | 'reply';
    sourceLanguage: string;
    targetLanguage: string;
    original: string;
    translated: string;
    timestamp: any;
}

export const History: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearing, setClearing] = useState(false);

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

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDeleteItem = async (itemId: string) => {
        setDeleting(itemId);
        try {
            await deleteDoc(doc(db, 'translations', itemId));
            setHistory(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete item. Please try again.");
        } finally {
            setDeleting(null);
        }
    };

    const handleClearAll = async () => {
        setClearing(true);
        try {
            // Use batch delete for efficiency
            const batch = writeBatch(db);
            history.forEach(item => {
                batch.delete(doc(db, 'translations', item.id));
            });
            await batch.commit();
            setHistory([]);
            setShowClearConfirm(false);
        } catch (error) {
            console.error("Error clearing history:", error);
            alert("Failed to clear history. Please try again.");
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-white">
            <Header title="History" />

            <div className="flex-1 overflow-y-auto p-6 pb-24 fade-in">
                {loading ? (
                    <div className="flex items-center justify-center h-[50vh]">
                        <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-neutral-500 space-y-4">
                        <MessageSquare size={48} />
                        <p>No history found.</p>
                        <p className="text-xs text-neutral-600">Your translations will appear here</p>
                    </div>
                ) : (
                    <>
                        {/* Clear All Button */}
                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-500 hover:border-red-900/50 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                <span>Clear All</span>
                            </button>
                        </div>

                        {/* History Items */}
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3 relative group"
                                >
                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        disabled={deleting === item.id}
                                        className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-red-900/20 text-neutral-500 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        title="Delete this item"
                                    >
                                        {deleting === item.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>

                                    <div className="flex items-center justify-between text-xs text-neutral-500 uppercase tracking-wider font-semibold pr-10">
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
                    </>
                )}
            </div>

            {/* Clear All Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-900/20 rounded-xl">
                                <AlertTriangle size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Clear All History?</h3>
                                <p className="text-sm text-neutral-400">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-neutral-400 text-sm">
                            You are about to delete <strong className="text-white">{history.length}</strong> translation{history.length !== 1 ? 's' : ''} from your history.
                        </p>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                disabled={clearing}
                                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={clearing}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {clearing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Clearing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Clear All</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
