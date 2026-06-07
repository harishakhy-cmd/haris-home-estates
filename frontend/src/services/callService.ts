'use client';

import { Socket } from 'socket.io-client';

export interface CallInitiateParams {
  recipientId: string;
  callType: 'audio' | 'video';
}

export interface IceCandidateParams {
  callId: string;
  candidate: RTCIceCandidateInit;
}

export interface OfferParams {
  callId: string;
  offer: RTCSessionDescriptionInit;
}

export interface AnswerParams {
  callId: string;
  answer: RTCSessionDescriptionInit;
}

export interface ToggleMuteParams {
  callId: string;
  muted: boolean;
}

export interface ToggleVideoParams {
  callId: string;
  videoEnabled: boolean;
}

export class CallService {
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  /**
   * Initiate a call
   */
  initiateCall(params: CallInitiateParams): Promise<{ callId: string }> {
    return new Promise((resolve, reject) => {
      this.socket.emit('initiateCall', params, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Answer an incoming call
   */
  answerCall(callId: string): void {
    this.socket.emit('answerCall', { callId });
  }

  /**
   * Reject an incoming call
   */
  rejectCall(callId: string): void {
    this.socket.emit('rejectCall', { callId });
  }

  /**
   * End an active call
   */
  endCall(callId: string): void {
    this.socket.emit('endCall', { callId });
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(params: IceCandidateParams): void {
    this.socket.emit('iceCandidate', params);
  }

  /**
   * Send WebRTC offer
   */
  sendOffer(params: OfferParams): void {
    this.socket.emit('offer', params);
  }

  /**
   * Send WebRTC answer
   */
  sendAnswer(params: AnswerParams): void {
    this.socket.emit('answer', params);
  }

  /**
   * Toggle mute status
   */
  toggleMute(params: ToggleMuteParams): void {
    this.socket.emit('toggleMute', params);
  }

  /**
   * Toggle video status
   */
  toggleVideo(params: ToggleVideoParams): void {
    this.socket.emit('toggleVideo', params);
  }

  /**
   * Listen for incoming calls
   */
  onIncomingCall(callback: (data: any) => void): void {
    this.socket.on('incomingCall', callback);
  }

  /**
   * Listen for call answered
   */
  onCallAnswered(callback: (data: any) => void): void {
    this.socket.on('callAnswered', callback);
  }

  /**
   * Listen for call rejected
   */
  onCallRejected(callback: (data: any) => void): void {
    this.socket.on('callRejected', callback);
  }

  /**
   * Listen for call ended
   */
  onCallEnded(callback: (data: any) => void): void {
    this.socket.on('callEnded', callback);
  }

  /**
   * Listen for ICE candidates
   */
  onIceCandidate(callback: (data: any) => void): void {
    this.socket.on('iceCandidate', callback);
  }

  /**
   * Listen for WebRTC offer
   */
  onOffer(callback: (data: any) => void): void {
    this.socket.on('offer', callback);
  }

  /**
   * Listen for WebRTC answer
   */
  onAnswer(callback: (data: any) => void): void {
    this.socket.on('answer', callback);
  }

  /**
   * Listen for user muted
   */
  onUserMuted(callback: (data: any) => void): void {
    this.socket.on('userMuted', callback);
  }

  /**
   * Listen for user video toggled
   */
  onUserVideoToggled(callback: (data: any) => void): void {
    this.socket.on('userVideoToggled', callback);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.socket.removeAllListeners('incomingCall');
    this.socket.removeAllListeners('callAnswered');
    this.socket.removeAllListeners('callRejected');
    this.socket.removeAllListeners('callEnded');
    this.socket.removeAllListeners('iceCandidate');
    this.socket.removeAllListeners('offer');
    this.socket.removeAllListeners('answer');
    this.socket.removeAllListeners('userMuted');
    this.socket.removeAllListeners('userVideoToggled');
  }
}
