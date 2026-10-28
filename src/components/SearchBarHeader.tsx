'use client';

import { Home, SlidersHorizontal, Plus, MoreVertical, Shield } from 'lucide-react';

interface SearchBarHeaderProps {
  url: string;
  showControls?: boolean;
}

export default function SearchBarHeader({ url, showControls = true }: SearchBarHeaderProps) {
  const handleLogout = () => {
      if (typeof (window as any).handleLogoutMain === 'function') {
        (window as any).handleLogoutMain();
      }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-[#202124] text-white/80 flex items-center">
      <div className="container mx-auto max-w-lg h-full px-2">
        <div className="flex h-full items-center justify-between gap-2">
          <button className="p-2 rounded-full hover:bg-white/10">
            <Home className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-[#303134] rounded-full h-10 px-4 text-sm">
            <Shield className="h-4 w-4 text-white/60" />
            <p className="flex-1 truncate">{url}</p>
          </div>
          {showControls && (
            <>
              <button className="p-2 rounded-full hover:bg-white/10">
                <Plus className="h-5 w-5" />
              </button>
              <div className="h-6 w-6 text-xs bg-gray-500 rounded-full flex items-center justify-center">2</div>
              <button className="p-2 rounded-full hover:bg-white/10" onClick={handleLogout}>
                <MoreVertical className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
