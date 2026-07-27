"use client";

import Sidebar from "./sidebar";
import ProtectedRoute from "./protected-route";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-zinc-950">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {/* Extra top padding on mobile clears the fixed hamburger toggle from Sidebar */}
          <div className="px-4 pt-16 pb-8 md:px-8 md:py-8 lg:px-12 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
