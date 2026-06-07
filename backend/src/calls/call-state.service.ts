import { Injectable } from '@nestjs/common';

export interface ActiveCall {
  callId: string;
  initiatorId: string;
  recipientId: string;
  initiatorSocketId: string;
  recipientSocketId?: string;
  status: 'ringing' | 'answered' | 'ended';
  callType: 'audio' | 'video';
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
}

@Injectable()
export class CallStateService {
  private activeCalls = new Map<string, ActiveCall>();
  private userCallMap = new Map<string, string>(); // userId -> callId

  /**
   * Create a new call
   */
  createCall(
    callId: string,
    initiatorId: string,
    recipientId: string,
    initiatorSocketId: string,
    callType: 'audio' | 'video'
  ): ActiveCall {
    const call: ActiveCall = {
      callId,
      initiatorId,
      recipientId,
      initiatorSocketId,
      status: 'ringing',
      callType,
      startedAt: new Date(),
    };

    this.activeCalls.set(callId, call);
    this.userCallMap.set(initiatorId, callId);
    this.userCallMap.set(recipientId, callId);

    return call;
  }

  /**
   * Get call by ID
   */
  getCall(callId: string): ActiveCall | undefined {
    return this.activeCalls.get(callId);
  }

  /**
   * Get call by user ID
   */
  getUserCall(userId: string): ActiveCall | undefined {
    const callId = this.userCallMap.get(userId);
    return callId ? this.activeCalls.get(callId) : undefined;
  }

  /**
   * Update call status
   */
  updateCallStatus(
    callId: string,
    status: 'ringing' | 'answered' | 'ended',
    recipientSocketId?: string
  ): ActiveCall | null {
    const call = this.activeCalls.get(callId);
    if (!call) return null;

    call.status = status;
    if (recipientSocketId) {
      call.recipientSocketId = recipientSocketId;
    }

    if (status === 'answered' && !call.startedAt) {
      call.startedAt = new Date();
    }

    return call;
  }

  /**
   * End call and calculate duration
   */
  endCall(callId: string): ActiveCall | null {
    const call = this.activeCalls.get(callId);
    if (!call) return null;

    call.status = 'ended';
    call.endedAt = new Date();

    if (call.startedAt) {
      call.duration = Math.round(
        (call.endedAt.getTime() - call.startedAt.getTime()) / 1000
      );
    }

    return call;
  }

  /**
   * Remove call
   */
  removeCall(callId: string): boolean {
    const call = this.activeCalls.get(callId);
    if (!call) return false;

    this.userCallMap.delete(call.initiatorId);
    this.userCallMap.delete(call.recipientId);
    this.activeCalls.delete(callId);

    return true;
  }

  /**
   * Check if user is in an active call
   */
  isUserInCall(userId: string): boolean {
    const callId = this.userCallMap.get(userId);
    if (!callId) return false;

    const call = this.activeCalls.get(callId);
    return call ? call.status !== 'ended' : false;
  }

  /**
   * Get all active calls (excluding ended)
   */
  getActiveCalls(): ActiveCall[] {
    return Array.from(this.activeCalls.values()).filter((call) => call.status !== 'ended');
  }

  /**
   * Clean up old ended calls (older than 1 hour)
   */
  cleanupOldCalls(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let count = 0;

    for (const [callId, call] of this.activeCalls.entries()) {
      if (call.status === 'ended' && call.endedAt && call.endedAt < oneHourAgo) {
        this.removeCall(callId);
        count++;
      }
    }

    return count;
  }
}
