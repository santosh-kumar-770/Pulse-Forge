import React from 'react';
import { Clock, Shield, Compass, ArrowRight, Lock } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';

export default function AwaitingApprovalScreen({ onOpenDiscover }) {
  const { activeRoom, rooms, switchRoom } = useRoom();

  const otherRooms = rooms.filter(r => r.id !== activeRoom?.id);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-sm space-y-6">
        {/* Animated Gate Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Clock className="w-8 h-8 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Join Request Pending
          </span>
          <h2 className="text-xl font-bold text-slate-100">
            Awaiting Host Approval
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your application to enter <strong className="text-slate-200">{activeRoom?.name}</strong> is currently pending review by the war-room host.
          </p>
        </div>

        {activeRoom?.mission_statement && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Sprint Objective:
            </span>
            <p className="text-xs text-slate-300 mt-1 italic">
              "{activeRoom.mission_statement}"
            </p>
          </div>
        )}

        {/* Alternate Actions */}
        <div className="pt-2 flex flex-col gap-2.5">
          {otherRooms.length > 0 && (
            <button
              onClick={() => switchRoom(otherRooms[0].id)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2"
            >
              Switch to {otherRooms[0].name}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenDiscover}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition flex items-center justify-center gap-2"
          >
            <Compass className="w-3.5 h-3.5" />
            Explore Other Public War Rooms
          </button>
        </div>
      </div>
    </div>
  );
}
