import React, { useEffect, useState } from 'react';

export const UpdateToast: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('sw-update', handler);
    return () => {
      window.removeEventListener('sw-update', handler);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-[480px] px-3 z-50">
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <span className="text-sm">New update available — Refresh</span>
        <button
          onClick={() => {
            location.reload();
          }}
          className="px-3 py-2 bg-[#E50914] rounded-lg text-white text-sm font-semibold"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};
