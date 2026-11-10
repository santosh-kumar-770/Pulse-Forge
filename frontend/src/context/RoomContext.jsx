import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { roomsApi } from '../api/rooms';
import { useAuth } from './AuthContext';

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = useCallback(async (preferredRoomId = null) => {
    if (!user) {
      setRooms([]);
      setActiveRoom(null);
      setPendingRoom(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await roomsApi.listRooms();
      setRooms(data);

      if (data.length > 0) {
        const storedRoomId = preferredRoomId || localStorage.getItem('pulseforge_active_room_id');
        const match = data.find(r => String(r.id) === String(storedRoomId)) || data[0];
        setActiveRoom(match);
        setPendingRoom(null);
        localStorage.setItem('pulseforge_active_room_id', String(match.id));
      } else {
        setActiveRoom(null);
        localStorage.removeItem('pulseforge_active_room_id');
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const switchRoom = (roomOrId) => {
    if (!roomOrId) return;
    const targetRoom = typeof roomOrId === 'object'
      ? roomOrId
      : rooms.find(r => String(r.id) === String(roomOrId));

    if (targetRoom) {
      setActiveRoom(targetRoom);
      setPendingRoom(null);
      localStorage.setItem('pulseforge_active_room_id', String(targetRoom.id));
    }
  };

  const setAwaitingRoom = (room) => {
    setPendingRoom(room);
  };

  const clearAwaitingRoom = () => {
    setPendingRoom(null);
    if (rooms.length > 0) {
      setActiveRoom(rooms[0]);
    }
  };

  const leaveActiveRoom = async (roomIdToLeave) => {
    const id = roomIdToLeave || activeRoom?.id;
    if (!id) return;
    await roomsApi.leaveRoom(id);
    const remaining = rooms.filter(r => String(r.id) !== String(id));
    setRooms(remaining);
    if (remaining.length > 0) {
      setActiveRoom(remaining[0]);
      localStorage.setItem('pulseforge_active_room_id', String(remaining[0].id));
    } else {
      setActiveRoom(null);
      localStorage.removeItem('pulseforge_active_room_id');
    }
    await fetchRooms();
  };

  const myRole = activeRoom?.my_role || 'member';

  return (
    <RoomContext.Provider value={{
      rooms,
      activeRoom: pendingRoom || activeRoom,
      activeRoomId: pendingRoom ? pendingRoom.id : activeRoom?.id,
      isPendingApproval: Boolean(pendingRoom),
      setAwaitingRoom,
      clearAwaitingRoom,
      myRole,
      isLoading,
      switchRoom,
      leaveActiveRoom,
      refreshRooms: fetchRooms
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used within a RoomProvider');
  return context;
}
