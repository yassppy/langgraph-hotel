"use client";

import { useState, useCallback } from "react";
import { AuthProvider } from "./context/auth-context";
import Sidebar, { type NavPage } from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import InfoPanel from "./components/InfoPanel";
import AuthModal from "./components/AuthModal";

function App() {
  const [activePage, setActivePage] = useState<NavPage>("inicio");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openLogin = useCallback(() => setShowAuthModal(true), []);
  const closeLogin = useCallback(() => setShowAuthModal(false), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: "#f0f4f8" }}
    >
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLoginClick={openLogin}
        isMobileOpen={isSidebarOpen}
        onMobileClose={closeSidebar}
      />

      {/* Main content */}
      <main className="flex flex-1 min-w-0 h-full overflow-hidden">
        {/* Chat column */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          <ChatArea
            onLoginRequired={openLogin}
            onOpenSidebar={openSidebar}
          />
        </div>

        {/* Info panel — desktop only */}
        <InfoPanel onLoginClick={openLogin} />
      </main>

      {/* Auth modal — inline, no redirect */}
      {showAuthModal && <AuthModal onClose={closeLogin} />}
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
