'use client';

import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video as VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncomingCallModalProps {
  isOpen: boolean;
  caller?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  callType?: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  caller,
  callType = 'audio',
  onAccept,
  onReject,
}) => {
  const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Create ringtone audio
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Simple ringtone using oscillators
      const playRingtone = () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440; // A4 note

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.5);

        setTimeout(playRingtone, 600);
      };

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(playRingtone);
      } else {
        playRingtone();
      }
    }
  }, [isOpen]);

  if (!isOpen || !caller) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="mx-4 w-full max-w-sm rounded-3xl border border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card))]/90 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Caller avatar */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {caller.avatarUrl ? (
              <img
                src={caller.avatarUrl}
                alt={`${caller.firstName} ${caller.lastName}`}
                className="h-24 w-24 rounded-full border-4 border-[hsl(var(--primary))]/30 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[hsl(var(--primary))]/30 bg-[hsl(var(--muted))] shadow-lg">
                <span className="text-2xl font-bold text-[hsl(var(--muted-foreground))]">
                  {caller.firstName.charAt(0)}
                  {caller.lastName.charAt(0)}
                </span>
              </div>
            )}

            {/* Call type indicator */}
            {callType === 'video' && (
              <div className="absolute bottom-0 right-0 rounded-full bg-[hsl(var(--primary))] p-2 text-white shadow-lg">
                <VideoIcon size={16} />
              </div>
            )}
          </div>
        </div>

        {/* Caller name */}
        <div className="mb-2 text-center">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            {caller.firstName} {caller.lastName}
          </h2>
        </div>

        {/* Call type text */}
        <div className="mb-8 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {callType === 'video' ? 'Incoming video call' : 'Incoming audio call'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          {/* Reject button */}
          <button
            onClick={onReject}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500/20 px-6 py-4 font-semibold text-red-500 transition hover:bg-red-500/30 active:scale-95"
          >
            <PhoneOff size={20} />
            <span>Reject</span>
          </button>

          {/* Accept button */}
          <button
            onClick={onAccept}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500/20 px-6 py-4 font-semibold text-green-500 transition hover:bg-green-500/30 active:scale-95"
          >
            <Phone size={20} />
            <span>Accept</span>
          </button>
        </div>

        {/* Subtle animation */}
        <style>{`
          @keyframes pulse-scale {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .pulse-call {
            animation: pulse-scale 2s infinite;
          }
        `}</style>
      </div>
    </div>
  );
};
