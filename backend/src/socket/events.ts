/**
 * Socket.IO Event Definitions
 * Type-safe event names and payloads for real-time communication
 */

export enum SocketEvents {
  // Connection
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',

  // Messaging
  SEND_MESSAGE = 'sendMessage',
  NEW_MESSAGE = 'newMessage',
  MESSAGE_DELIVERED = 'messageDelivered',
  MESSAGE_READ = 'messageRead',
  MESSAGES_READ = 'messagesRead',
  MARK_READ = 'markRead',
  TYPING = 'typing',
  STOP_TYPING = 'stopTyping',

  // Message Actions
  REACT_MESSAGE = 'reactMessage',
  MESSAGE_REACTED = 'messageReacted',
  DELETE_MESSAGE = 'deleteMessage',
  MESSAGE_DELETED = 'messageDeleted',
  EDIT_MESSAGE = 'editMessage',
  MESSAGE_EDITED = 'messageEdited',

  // Groups
  CREATE_GROUP = 'createGroup',
  GROUP_CREATED = 'groupCreated',
  JOIN_ROOM = 'joinRoom',

  // Presence
  USER_ONLINE = 'userOnline',
  USER_OFFLINE = 'userOffline',

  // WebRTC Calls
  CALL_USER = 'callUser',
  INCOMING_CALL = 'incomingCall',
  ANSWER_CALL = 'answerCall',
  REJECT_CALL = 'rejectCall',
  END_CALL = 'endCall',
  WEBRTC_OFFER = 'webrtcOffer',
  WEBRTC_ANSWER = 'webrtcAnswer',
  WEBRTC_ICE_CANDIDATE = 'webrtcIceCandidate',
  WEBRTC_CALL_ENDED = 'webrtcCallEnded',

  // Dashboard & Real-time Updates
  PROPERTY_CREATED = 'propertyCreated',
  PROPERTY_UPDATED = 'propertyUpdated',
  PAYMENT_UPDATED = 'paymentUpdated',
  BOOKING_STATUS_CHANGED = 'bookingStatusChanged',
  USER_PROFILE_UPDATED = 'userProfileUpdated',
  MAINTENANCE_UPDATE = 'maintenanceUpdate',
  STATISTICS_UPDATED = 'statisticsUpdated',

  // Notifications
  PUSH_NOTIFICATION = 'pushNotification',
}

export interface AuthenticatePayload {
  token: string;
}

export interface SendMessagePayload {
  recipientId?: string;
  groupId?: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
  callId?: string;
  clientTempId?: string;
  viewOnce?: boolean;
  voiceUrl?: string;
  voiceDuration?: number;
  voiceSize?: number;
  mediaUrl?: string;
  mediaType?: string;
  mediaThumbnail?: string;
  mediaSize?: number;
}

export interface NewMessagePayload {
  id: string;
  senderId: string;
  recipientId?: string;
  groupId?: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  voiceUrl?: string;
  voiceDuration?: number;
  mediaUrl?: string;
  mediaType?: string;
  clientTempId?: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  createdAt: Date;
}

export interface MessageStatusPayload {
  messageId: string;
  status: 'DELIVERED' | 'READ';
  timestamp: Date;
}

export interface MarkReadPayload {
  senderId?: string;
  groupId?: string;
}

export interface TypingPayload {
  recipientId?: string;
  groupId?: string;
  senderId: string;
  isTyping: boolean;
}

export interface TypingIndicatorPayload {
  senderId: string;
  recipientId?: string;
  groupId?: string;
  isTyping: boolean;
}

export interface ReactMessagePayload {
  messageId: string;
  emoji: string;
}

export interface MessageReactionPayload {
  messageId: string;
  reactions: Array<{ userId: string; emoji: string }>;
}

export interface DeleteMessagePayload {
  messageId: string;
}

export interface EditMessagePayload {
  messageId: string;
  content: string;
}

export interface CreateGroupPayload {
  name: string;
  memberIds: string[];
}

export interface UserPresencePayload {
  userId: string;
  timestamp: Date;
}

export interface CallPayload {
  targetId: string;
  callType: 'audio' | 'video';
}

export interface WebRTCOfferPayload {
  targetId: string;
  sdp?: any;
  offer?: any;
  isVideo?: boolean;
  callType?: 'audio' | 'video';
}

export interface WebRTCAnswerPayload {
  targetId: string;
  sdp?: any;
  answer?: any;
}

export interface WebRTCCandidatePayload {
  targetId: string;
  candidate: any;
}

export interface WebRTCCallEndedPayload {
  targetId: string;
}

export interface PropertyCreatedPayload {
  id: string;
  title: string;
  price: number;
  city: string;
  propertyType: string;
  landlordId: string;
}

export interface PaymentUpdatedPayload {
  id: string;
  status: string;
  amount: number;
  userId: string;
}

export interface BookingStatusChangedPayload {
  id: string;
  status: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
}

export type SocketPayload =
  | AuthenticatePayload
  | SendMessagePayload
  | TypingPayload
  | MarkReadPayload
  | ReactMessagePayload
  | DeleteMessagePayload
  | EditMessagePayload
  | CreateGroupPayload
  | CallPayload
  | WebRTCOfferPayload
  | WebRTCAnswerPayload
  | WebRTCCandidatePayload
  | WebRTCCallEndedPayload;
