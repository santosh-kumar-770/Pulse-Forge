import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider, useRoom } from './context/RoomContext';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import AwaitingApprovalScreen from './components/layout/AwaitingApprovalScreen';

import CommandPalette from './components/command/CommandPalette';
import NewTaskModal from './components/modals/NewTaskModal';
import NewImportantModal from './components/modals/NewImportantModal';
import NewAchievementModal from './components/modals/NewAchievementModal';
import NewTimelineModal from './components/modals/NewTimelineModal';
import NewRoomModal from './components/modals/NewRoomModal';
import JoinRoomModal from './components/modals/JoinRoomModal';
import AddMemberModal from './components/modals/AddMemberModal';
import ProfileModal from './components/modals/ProfileModal';
import RoomSettingsModal from './components/modals/RoomSettingsModal';
import DiscoverRoomsModal from './components/modals/DiscoverRoomsModal';
import WarRoomChatDrawer from './components/chat/WarRoomChatDrawer';

import MissionBoardView from './views/MissionBoardView';
import TimelineView from './views/TimelineView';
import AchievementsView from './views/AchievementsView';
import MembersView from './views/MembersView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
      retry: 1,
    },
  },
});

function AppShell() {
  const { user, isLoading } = useAuth();
  const { isPendingApproval } = useRoom();

  // Modals & Panels state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isImportantModalOpen, setIsImportantModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400">Initializing PulseForge War Room...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <Navbar
        onOpenCommandPalette={setIsCommandOpen}
        onOpenNewRoomModal={() => setIsRoomModalOpen(true)}
        onOpenJoinRoomModal={() => setIsJoinModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenRoomSettings={() => setIsRoomSettingsOpen(true)}
        onOpenDiscoverRooms={() => setIsDiscoverModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onOpenRoomSettings={() => setIsRoomSettingsOpen(true)}
          onOpenDiscoverRooms={() => setIsDiscoverModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {/* Guard Check: If user has a pending join request for active room */}
          {isPendingApproval ? (
            <AwaitingApprovalScreen onOpenDiscover={() => setIsDiscoverModalOpen(true)} />
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <MissionBoardView
                    onOpenTaskModal={() => setIsTaskModalOpen(true)}
                    onOpenImportantModal={() => setIsImportantModalOpen(true)}
                  />
                }
              />
              <Route
                path="/timeline"
                element={
                  <TimelineView
                    onOpenTimelineModal={() => setIsTimelineModalOpen(true)}
                  />
                }
              />
              <Route
                path="/achievements"
                element={
                  <AchievementsView
                    onOpenAchievementModal={() => setIsAchievementModalOpen(true)}
                  />
                }
              />
              <Route
                path="/members"
                element={
                  <MembersView
                    onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
                    onOpenRoomSettings={() => setIsRoomSettingsOpen(true)}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <SettingsView
                    onOpenProfileModal={() => setIsProfileModalOpen(true)}
                    onOpenRoomSettings={() => setIsRoomSettingsOpen(true)}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>

        {/* Real-Time War-Room Team Chat Drawer */}
        {!isPendingApproval && (
          <WarRoomChatDrawer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>

      {/* Global Modals & Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={setIsCommandOpen}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenImportantModal={() => setIsImportantModalOpen(true)}
        onOpenAchievementModal={() => setIsAchievementModalOpen(true)}
        onOpenTimelineModal={() => setIsTimelineModalOpen(true)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenRoomSettings={() => setIsRoomSettingsOpen(true)}
        onOpenDiscoverRooms={() => setIsDiscoverModalOpen(true)}
        onToggleChat={() => setIsChatOpen(prev => !prev)}
      />

      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      <NewImportantModal
        isOpen={isImportantModalOpen}
        onClose={() => setIsImportantModalOpen(false)}
      />

      <NewAchievementModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
      />

      <NewTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
      />

      <NewRoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <RoomSettingsModal
        isOpen={isRoomSettingsOpen}
        onClose={() => setIsRoomSettingsOpen(false)}
      />

      <DiscoverRoomsModal
        isOpen={isDiscoverModalOpen}
        onClose={() => setIsDiscoverModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoomProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </RoomProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
