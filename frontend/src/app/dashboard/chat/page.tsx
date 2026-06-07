'use client';

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageCircle,
  Users,
  Phone,
  Video,
  Paperclip,
  Send,
  Search,
  Plus,
  ArrowLeft,
  X,
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MoreVertical,
  Ban,
  Flag,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { useSettingsStore } from '@/store/settings-store';
import { STICKERS } from '@/lib/stickers';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { UserSearchModal } from '@/components/layout/user-search-modal';
import ThemeSelector from '@/components/chat/ThemeSelector';
import { FriendRequestsModal } from '@/components/layout/friend-requests-modal';
import { toast } from 'sonner';
import { getLocalUsers } from '@/lib/local-auth';




/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  clientTempId?: string;
  senderId: string;
  recipientId?: string;
  groupId?: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
  createdAt: string;
  readAt?: string | null;
  sender?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
  reactions?: { userId: string; emoji: string }[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  avatarUrl?: string | null;
  role?: string;
  location?: string | null;
  verified?: boolean;
}

interface Conversation {
  id: string;
  recipientId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unread?: number;
}

interface Group {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageAt?: string;
  members?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null }[];
}

type FriendshipUiStatus = 'NONE' | 'SELF' | 'BLOCKED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED';

/* ------------------------------------------------------------------ */
/*  Socket singleton                                                   */
/* ------------------------------------------------------------------ */

let socketInstance: Socket | null = null;

function getSocket(token: string): Socket {
  if (socketInstance?.connected) return socketInstance;
  const wsUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace('/api/v1', '');
  socketInstance = io(wsUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });
  return socketInstance;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function initials(firstName?: string, lastName?: string) {
  return `${(firstName ?? '?')[0]}${(lastName ?? '')[0] ?? ''}`.toUpperCase();
}

function isImageFile(url?: string, type?: string) {
  if (type?.startsWith('image')) return true;
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
}

function isAudioFile(type?: string) {
  return type?.startsWith('audio') ?? false;
}

function isVideoFile(type?: string) {
  return type?.startsWith('video') ?? false;
}

function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined' || !('isTypeSupported' in MediaRecorder)) return '';
  return [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
  ].find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

function getMediaErrorMessage(err: any, action: string) {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return `${action} requires HTTPS on mobile browsers.`;
  }
  if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
    return 'Please allow microphone and camera access, then try again.';
  }
  if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
    return 'No microphone or camera was found on this device.';
  }
  return err?.message || `Failed to ${action.toLowerCase()}.`;
}

/* ------------------------------------------------------------------ */
/*  Avatar component                                                   */
/* ------------------------------------------------------------------ */

function Avatar({ src, firstName, lastName, size = 40 }: { src?: string | null; firstName?: string; lastName?: string; size?: number }) {
  return src ? (
    <img
      src={src}
      alt={`${firstName ?? ''} ${lastName ?? ''}`}
      className="rounded-full object-cover ring-2 ring-[hsl(var(--border))]"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] font-semibold text-[hsl(var(--primary-foreground))]"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(firstName, lastName)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

function ChatLoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-10 text-center shadow-2xl backdrop-blur-xl">
        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--primary))]" />
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Loading chat...</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingFallback />}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get('userId');

  /* auth */
  const { user, token, hydrate } = useAuthStore();
  useEffect(() => { hydrate(); }, [hydrate]);

  /* socket ref */
  const socketRef = useRef<Socket | null>(null);
  const activeChatRef = useRef<{ id: string; isGroup: boolean; name: string; avatarUrl?: string | null } | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* data */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  /* ui state */
  const [tab, setTab] = useState<'direct' | 'groups'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState<{ id: string; isGroup: boolean; name: string; avatarUrl?: string | null } | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Harassment');
  const [reportDesc, setReportDesc] = useState('');
  const [activeFriendshipStatus, setActiveFriendshipStatus] = useState<FriendshipUiStatus>('NONE');
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const onlineUserIds = onlineUsers.map((u) => u.id);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  /* group modal */
  const [newGroupName, setNewGroupName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);

  /* file upload */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; fileType?: string; fileName?: string } | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerQuery, setStickerQuery] = useState('');
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const bubbleShape = useSettingsStore((s) => s.bubbleShape);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [newListingsCount, setNewListingsCount] = useState(0);
  const [appBadgeCount, setAppBadgeCount] = useState(0);

  useEffect(() => {
    activeChatRef.current = activeChat;
    setTypingUserIds([]);
  }, [activeChat]);

  /* call state */
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'active'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callTargetId, setCallTargetId] = useState<string | null>(null);
  const [callTargetName, setCallTargetName] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneOscRef = useRef<OscillatorNode | null>(null);
  const ringtoneGainRef = useRef<GainNode | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<{ offer: RTCSessionDescriptionInit; senderId: string } | null>(null);

  /* scroll ref */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  /* ---------------------------------------------------------------- */
  /*  Fetch conversations & groups                                     */
  /* ---------------------------------------------------------------- */

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get('/chat/groups');
      setGroups(res.data ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!token) return;
    if (token.startsWith('local-')) {
      setOnlineUsers([]);
      setPendingRequestsCount(0);
      setSuggestedUsers(getLocalUsers().filter((item) => item.id !== user?.id));
      return;
    }
    // Fetch online users list
    api.get('/users/online')
      .then(res => setOnlineUsers(res.data ?? []))
      .catch(() => setOnlineUsers([]));
      
    api.get('/friendships/pending')
      .then(res => setPendingRequestsCount(res.data?.length ?? 0))
      .catch(() => setPendingRequestsCount(0));

    api.get('/users/search', { params: { q: '' } })
      .then(res => setSuggestedUsers(res.data ?? []))
      .catch(() => setSuggestedUsers([]));
  }, [token, user?.id]);

    // Update app badge and document title for unread counts and new listings
    useEffect(() => {
      const totalUnread = (conversations?.reduce((s, c) => s + (c.unread ?? 0), 0) ?? 0) + newListingsCount;
      setAppBadgeCount(totalUnread);
      if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
        try { (navigator as any).setAppBadge(totalUnread); } catch { /* ignore */ }
      } else {
        if (totalUnread > 0) document.title = `(${totalUnread}) Haris`; else document.title = 'Haris';
      }
    }, [conversations, newListingsCount]);

useEffect(() => {
  if (!token) return;
  if (token.startsWith('local-')) {
    setConversations([]);
    setGroups([]);
    return;
  }
  fetchConversations();
  fetchGroups();
}, [token, fetchConversations, fetchGroups]);

  /* ---------------------------------------------------------------- */
  /*  Socket setup                                                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!token || !user) return;
    if (token.startsWith('local-')) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });

    if (socket.connected) {
      socket.emit('authenticate', token);
    }

    socket.on('newMessage', (msg: Message) => {
      const current = activeChatRef.current;
      const belongsToActiveChat = current && (
        current.isGroup
          ? msg.groupId === current.id
          : msg.groupId == null && (
            (msg.senderId === current.id && msg.recipientId === user.id) ||
            (msg.senderId === user.id && msg.recipientId === current.id)
          )
      );

      if (belongsToActiveChat) {
        setMessages((prev) => {
          if (msg.clientTempId) {
            const tempIndex = prev.findIndex((m) => m.id === msg.clientTempId);
            if (tempIndex >= 0) {
              const next = [...prev];
              next[tempIndex] = msg;
              return next;
            }
          }
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (!current.isGroup && msg.senderId === current.id) {
          socket.emit('markRead', { senderId: current.id });
        }
      }

      /* refresh sidebar */
      fetchConversations();
      fetchGroups();
    });

    socket.on('messageReacted', (event: { messageId: string; reactions: any[] }) => {
      setMessages((prev) => prev.map(m => m.id === event.messageId ? { ...m, reactions: event.reactions } as any : m));
    });

    socket.on('messageDeleted', (event: { messageId: string }) => {
      setMessages((prev) => prev.filter(m => m.id !== event.messageId));
      fetchConversations();
    });

    socket.on('messageEdited', (msg: Message) => {
      setMessages((prev) => prev.map(m => m.id === msg.id ? msg : m));
    });

    socket.on('newProperty', (data: any) => {
      setNewListingsCount((c) => c + 1);
      setAppBadgeCount((c) => c + 1);
    });

    socket.on('typing', (event: { senderId: string; groupId?: string; recipientId?: string; isTyping: boolean }) => {
      const current = activeChatRef.current;
      const belongsToActiveChat = current && (
        current.isGroup ? event.groupId === current.id : event.senderId === current.id
      );
      if (!belongsToActiveChat || event.senderId === user.id) return;
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        if (event.isTyping) next.add(event.senderId);
        else next.delete(event.senderId);
        return Array.from(next);
      });
    });

    socket.on('messagesRead', (event: { readerId: string }) => {
      const current = activeChatRef.current;
      if (!current || current.isGroup || current.id !== event.readerId) return;
      setMessages((prev) => prev.map((message) => (
        message.senderId === user.id ? { ...message, readAt: new Date().toISOString() } as Message : message
      )));
    });

    socket.on('groupCreated', (group: Group) => {
      setGroups((prev) => {
        if (prev.some((g) => g.id === group.id)) return prev;
        return [group, ...prev];
      });
    });

    const refreshOnline = () => {
      api.get('/users/online')
        .then(res => setOnlineUsers(res.data ?? []))
        .catch(() => setOnlineUsers([]));
    };

    socket.on('userOnline', () => refreshOnline());
    socket.on('userOffline', () => refreshOnline());

    socket.on('friendRequestReceived', () => {
      api.get('/friendships/pending')
        .then(res => setPendingRequestsCount(res.data?.length ?? 0))
        .catch(() => setPendingRequestsCount(0));
    });



    /* ---- WebRTC listeners ---- */
    socket.on('webrtcOffer', async (data: { offer: RTCSessionDescriptionInit; senderId: string; callType?: string }) => {
      if (callState === 'active' || callState === 'calling') return;
      pendingOfferRef.current = { offer: data.offer, senderId: data.senderId };
      setCallTargetId(data.senderId);
      setCallTargetName(data.senderId);
      setCallType(data.callType === 'video' ? 'video' : 'audio');
      setCallState('incoming');
    });

    socket.on('webrtcAnswer', async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallState('active');
      }
    });

    socket.on('webrtcIceCandidate', async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (pc && data.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* ignore */ }
      }
    });

    socket.on('webrtcCallEnded', () => {
      cleanupCall();
    });

    return () => {
      socket.off('newMessage');
      socket.off('typing');
      socket.off('messagesRead');
      socket.off('groupCreated');
      socket.off('webrtcOffer');
      socket.off('webrtcAnswer');
      socket.off('webrtcIceCandidate');
      socket.off('webrtcCallEnded');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  /* ---------------------------------------------------------------- */
  /*  Fetch messages for active chat                                   */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!activeChat) return;
    setLoading(true);
    api
      .get('/chat/messages', { params: { targetId: activeChat.id, isGroup: activeChat.isGroup } })
      .then((res) => {
        setMessages(res.data ?? []);
        if (!activeChat.isGroup) {
          socketRef.current?.emit('markRead', { senderId: activeChat.id });
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat || activeChat.isGroup) {
      setActiveFriendshipStatus('NONE');
      return;
    }

    api.get(`/friendships/status/${activeChat.id}`)
      .then((res) => setActiveFriendshipStatus(res.data?.status ?? 'NONE'))
      .catch(() => setActiveFriendshipStatus('NONE'));
  }, [activeChat]);

  /* ---------------------------------------------------------------- */
  /*  Send message                                                     */
  /* ---------------------------------------------------------------- */

  const sendMessage = useCallback(
    (content: string, fileUrl?: string, fileType?: string) => {
      const socket = socketRef.current;
      if (!socket || !activeChat) {
        toast.error('Chat connection is not ready yet.');
        return;
      }
      const optimisticId = `temp-${Date.now()}`;
      const payload: Record<string, unknown> = { content, clientTempId: optimisticId, viewOnce };
      if (fileUrl) {
        payload.fileUrl = fileUrl;
        payload.fileType = fileType;
      }
      if (activeChat.isGroup) {
        payload.groupId = activeChat.id;
      } else {
        payload.recipientId = activeChat.id;
      }
      /* optimistic append */
      const optimistic: Message = {
        id: optimisticId,
        senderId: user?.id ?? '',
        content,
        fileUrl,
        fileType,
        createdAt: new Date().toISOString(),
        ...(activeChat.isGroup ? { groupId: activeChat.id } : { recipientId: activeChat.id }),
      };
      setMessages((prev) => [...prev, optimistic]);

      socket.emit('sendMessage', payload, (response: any) => {
        if (response && response.error) {
          toast.error(response.error);
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        }
      });
      // reset viewOnce toggle after sending
      setViewOnce(false);
    },
    [activeChat, user?.id, viewOnce],
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!messageId || messageId.startsWith('temp-')) return;
    const previousMessages = messages;
    setMessages((prev) => prev.filter((message) => message.id !== messageId));
    setSelectedMessageId(null);

    const deleteViaApi = async (errorMessage?: string) => {
      try {
        await api.delete(`/chat/messages/${messageId}`);
      } catch (err: any) {
        setMessages(previousMessages);
        toast.error(errorMessage || err?.response?.data?.message || 'Failed to delete message');
      }
    };

    const socket = socketRef.current;
    if (!socket?.connected) {
      await deleteViaApi();
      return;
    }

    const fallbackTimer = setTimeout(() => {
      deleteViaApi();
    }, 1500);

    socket.emit('deleteMessage', { messageId }, async (response: any) => {
      clearTimeout(fallbackTimer);
      if (response?.success) return;
      await deleteViaApi(response?.error);
    });
  }, [messages]);

  const handleSend = () => {
    const text = messageInput.trim();
    if (!text && !attachment) return;
    if (activeChat) {
      socketRef.current?.emit('typing', activeChat.isGroup
        ? { groupId: activeChat.id, isTyping: false }
        : { recipientId: activeChat.id, isTyping: false });
    }
    if (editingMessageId) {
      socketRef.current?.emit('editMessage', { messageId: editingMessageId, content: text });
      setEditingMessageId(null);
      setMessageInput('');
      return;
    }
    if (attachment) {
      sendMessage(text, attachment.url, attachment.fileType);
      setAttachment(null);
    } else {
      sendMessage(text);
    }
    setMessageInput('');
  };

  const handleMessageInputChange = (value: string) => {
    setMessageInput(value);
    if (!activeChat) return;

    socketRef.current?.emit('typing', activeChat.isGroup
      ? { groupId: activeChat.id, isTyping: true }
      : { recipientId: activeChat.id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', activeChat.isGroup
        ? { groupId: activeChat.id, isTyping: false }
        : { recipientId: activeChat.id, isTyping: false });
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ---------------------------------------------------------------- */
  /*  File upload                                                      */
  /* ---------------------------------------------------------------- */

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/chat/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url: string = res.data?.url ?? res.data;
      // show attachment preview and let user add a caption before sending
      setAttachment({ url, fileType: res.data?.fileType ?? file.type, fileName: res.data?.fileName ?? file.name });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload media');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!stickerQuery) {
      setGiphyResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/chat/gifs/search`, { params: { q: stickerQuery } });
        setGiphyResults(res.data?.data || []);
      } catch (err) {
        setGiphyResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [stickerQuery]);

  const beginMessagePress = (messageId: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageId(messageId);
    }, 450);
  };

  const cancelMessagePress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Create group                                                     */
  /* ---------------------------------------------------------------- */

  const handleCreateGroup = () => {
    const socket = socketRef.current;
    if (!socket || !newGroupName.trim() || !memberIds.length) return;
    socket.emit('createGroup', { name: newGroupName.trim(), memberIds });
    setShowGroupModal(false);
    setNewGroupName('');
    setMemberIds([]);
    setMemberInput('');
  };

  const addMemberId = () => {
    const id = memberInput.trim();
    if (id && !memberIds.includes(id)) {
      setMemberIds((prev) => [...prev, id]);
      setMemberInput('');
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Select chat                                                      */
  /* ---------------------------------------------------------------- */

  const openDirectChat = useCallback((selectedUser: User) => {
    setActiveChat({
      id: selectedUser.id,
      isGroup: false,
      name: `${selectedUser.firstName} ${selectedUser.lastName}`,
      avatarUrl: selectedUser.avatarUrl,
    });
    setShowMobileChat(true);
    setConversations((prev) => {
      if (prev.some((c) => c.recipientId === selectedUser.id)) return prev;
      return [
        {
          id: `conv-${selectedUser.id}`,
          recipientId: selectedUser.id,
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          avatarUrl: selectedUser.avatarUrl,
          lastMessage: undefined,
          lastMessageAt: undefined,
          unread: 0,
        },
        ...prev,
      ];
    });
  }, []);

  const selectConversation = (conv: Conversation) => {
    setActiveChat({ id: conv.recipientId, isGroup: false, name: `${conv.firstName} ${conv.lastName}`, avatarUrl: conv.avatarUrl });
    setShowMobileChat(true);
  };

  const selectGroup = (group: Group) => {
    setActiveChat({ id: group.id, isGroup: true, name: group.name });
    setShowMobileChat(true);
  };

  useEffect(() => {
    if (!token || !requestedUserId || activeChat?.id === requestedUserId) return;

    const existing = conversations.find((conv) => conv.recipientId === requestedUserId);
    if (existing) {
      selectConversation(existing);
      return;
    }

    const suggested = suggestedUsers.find((item) => item.id === requestedUserId);
    if (suggested) {
      openDirectChat(suggested);
      return;
    }

    if (token.startsWith('local-')) {
      const localUser = getLocalUsers().find((item) => item.id === requestedUserId);
      if (localUser) {
        openDirectChat(localUser);
        return;
      }
      toast.error('Could not open that local chat.');
      return;
    }

    api.get(`/users/${requestedUserId}`)
      .then((res) => openDirectChat(res.data))
      .catch(() => toast.error('Could not open that chat.'));
  }, [activeChat?.id, conversations, openDirectChat, requestedUserId, suggestedUsers, token]);

  /* ---------------------------------------------------------------- */
  /*  WebRTC                                                           */
  /* ---------------------------------------------------------------- */

  const ICE_SERVERS: RTCIceServer[] = [
    // STUN servers (only candidate discovery, no relay)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // Free TURN servers (for mobile/NAT traversal)
    { urls: ['turn:openrelay.metered.ca:80'], username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: ['turn:openrelay.metered.ca:443'], username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: ['turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' },
  ];
  const startRingtone = useCallback(() => {
    if (typeof window === 'undefined') return;
    const AudioCtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AudioCtor) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      return;
    }
    try {
      const ctx = audioContextRef.current || new AudioCtor();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      if (ringtoneOscRef.current) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 440;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ringtoneOscRef.current = osc;
      ringtoneGainRef.current = gain;
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
    } catch {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneOscRef.current) {
      try { ringtoneOscRef.current.stop(); } catch { /* ignore */ }
      ringtoneOscRef.current.disconnect();
      ringtoneOscRef.current = null;
    }
    if (ringtoneGainRef.current) {
      ringtoneGainRef.current.disconnect();
      ringtoneGainRef.current = null;
    }
    if ('vibrate' in navigator) navigator.vibrate(0);
  }, []);

  const cleanupCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    pendingOfferRef.current = null;
    setCallState('idle');
    setCallTargetId(null);
    setCallTargetName('');
    setMicEnabled(true);
    setCamEnabled(true);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    stopRingtone();
  }, [stopRingtone]);

  const createPeerConnection = useCallback(
    (targetId: string) => {
      const socket = socketRef.current;
      if (!socket) return null;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      
      pc.onicegatheringstatechange = () => {
        console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
      };
      
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          console.log('[WebRTC] ICE candidate:', e.candidate.candidate);
          socket.emit('webrtcIceCandidate', { targetId, candidate: e.candidate.toJSON() });
        }
      };
      
      pc.ontrack = (e) => {
        console.log('[WebRTC] Received track:', e.track.kind);
        if (!e.streams?.[0]) return;
        const stream = e.streams[0];
        if (callType === 'video') {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        } else if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
        }
      };
      
      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          console.error('[WebRTC] Connection failed, cleaning up');
          toast.error('Call connection failed');
          cleanupCall();
        }
      };
      
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
      };
      
      peerConnectionRef.current = pc;
      return pc;
    },
    [cleanupCall],
  );

  const startCall = useCallback(
    async (type: 'audio' | 'video') => {
      if (!activeChat || activeChat.isGroup) return;
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        toast.error('Calls are not supported in this browser.');
        return;
      }
      if (typeof window !== 'undefined' && !window.isSecureContext && !window.location.hostname.includes('localhost')) {
        toast.error('Calls require HTTPS on mobile browsers.');
        return;
      }
      setCallType(type);
      setCallTargetId(activeChat.id);
      setCallTargetName(activeChat.name);
      setCallState('calling');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: type === 'video'
            ? { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 } }
            : false,
        });
        console.log('[WebRTC] Got local stream, tracks:', stream.getTracks().map(t => t.kind));
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = createPeerConnection(activeChat.id);
        if (!pc) {
          toast.error('Failed to create peer connection');
          cleanupCall();
          return;
        }
        stream.getTracks().forEach((track) => {
          console.log('[WebRTC] Adding track:', track.kind);
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('[WebRTC] Sending offer');
        socketRef.current?.emit('webrtcOffer', {
          targetId: activeChat.id,
          offer: pc.localDescription,
          callType: type,
        });
      } catch (err: any) {
        console.error('[WebRTC] Start call error:', err);
        toast.error(getMediaErrorMessage(err, `Start ${type} call`));
        cleanupCall();
      }
    },
    [activeChat, createPeerConnection, cleanupCall],
  );

  const acceptCall = useCallback(async () => {
    const pending = pendingOfferRef.current;
    if (!pending) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Calls are not supported in this browser.');
      cleanupCall();
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext && !window.location.hostname.includes('localhost')) {
      toast.error('Calls require HTTPS on mobile browsers.');
      cleanupCall();
      return;
    }
    setCallState('active');

    try {
      console.log('[WebRTC] Accepting call, requesting media');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: callType === 'video'
          ? { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 } }
          : false,
      });
      console.log('[WebRTC] Got local stream for answer, tracks:', stream.getTracks().map(t => t.kind));
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(pending.senderId);
      if (!pc) {
        toast.error('Failed to create peer connection');
        cleanupCall();
        return;
      }
      stream.getTracks().forEach((track) => {
        console.log('[WebRTC] Adding track for answer:', track.kind);
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(pending.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] Sending answer');
      socketRef.current?.emit('webrtcAnswer', { targetId: pending.senderId, answer: pc.localDescription });
      pendingOfferRef.current = null;
    } catch (err: any) {
      console.error('[WebRTC] Accept call error:', err);
      toast.error(getMediaErrorMessage(err, 'Accept call'));
      cleanupCall();
    }
  }, [callType, createPeerConnection, cleanupCall]);

  const endCall = useCallback(() => {
    if (callTargetId) {
      socketRef.current?.emit('webrtcCallEnded', { targetId: callTargetId });
    }
    cleanupCall();
  }, [callTargetId, cleanupCall]);

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicEnabled((v) => !v);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamEnabled((v) => !v);
  };

  /* ---------------------------------------------------------------- */
  /*  Block & Report                                                   */
  /* ---------------------------------------------------------------- */

  const handleBlockUser = async () => {
    if (!activeChat || activeChat.isGroup) return;
    if (confirm(`Are you sure you want to block ${activeChat.name}?`)) {
      try {
        await api.post(`/friendships/block/${activeChat.id}`);
        toast.success(`Blocked ${activeChat.name}`);
        setConversations(prev => prev.filter(c => c.recipientId !== activeChat.id));
        setActiveChat(null);
        setShowMobileChat(false);
        setShowOptionsMenu(false);
      } catch (err) {
        toast.error('Failed to block user');
      }
    }
  };

  const handleAddFriend = async () => {
    if (!activeChat || activeChat.isGroup) return;
    try {
      const res = await api.post(`/friendships/request/${activeChat.id}`);
      if (res.data?.status === 'ACCEPTED') {
        setActiveFriendshipStatus('ACCEPTED');
        toast.success('You are now friends');
      } else {
        setActiveFriendshipStatus('PENDING_SENT');
        toast.success('Friend request sent');
      }
      setShowOptionsMenu(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptActiveRequest = async () => {
    if (!activeChat || activeChat.isGroup) return;
    try {
      await api.post(`/friendships/accept/${activeChat.id}`);
      setActiveFriendshipStatus('ACCEPTED');
      toast.success('Friend request accepted');
      setPendingRequestsCount((count) => Math.max(0, count - 1));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleVoiceRecordToggle = async () => {
    if (recording) {
      mediaRecorder?.stop();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Microphone access is required for voice messages.');
      return;
    }
    
    if (typeof MediaRecorder === 'undefined') {
      toast.error('Voice messages are not supported in this browser.');
      return;
    }
    
    if (typeof window !== 'undefined' && !window.isSecureContext && !window.location.hostname.includes('localhost')) {
      toast.error('Voice messages require HTTPS on mobile browsers.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const extension = type.includes('mp4') ? 'm4a' : type.includes('mpeg') ? 'mp3' : 'webm';
        const blob = new Blob(chunks, { type });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setMediaRecorder(null);

        if (!blob.size) {
          toast.error('No audio was recorded.');
          return;
        }

        const fd = new FormData();
        fd.append('file', blob, `voice-message.${extension}`);
        setUploading(true);
        try {
          const res = await api.post('/chat/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          sendMessage('Voice message', res.data?.url ?? res.data, res.data?.fileType ?? type);
          toast.success('Voice message sent');
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Failed to send voice message');
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err: any) {
      toast.error(getMediaErrorMessage(err, 'Record voice message'));
    }
  };

  const submitReport = async () => {
    if (!activeChat || activeChat.isGroup) return;
    try {
      await api.post(`/reports/${activeChat.id}`, { reason: reportReason, description: reportDesc });
      toast.success('Report submitted successfully');
      setShowReportModal(false);
      setReportDesc('');
    } catch {
      toast.error('Failed to submit report');
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Filtered lists                                                   */
  /* ---------------------------------------------------------------- */

  const filteredConversations = useMemo(
    () => conversations.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())),
    [conversations, searchQuery],
  );

  const filteredGroups = useMemo(
    () => groups.filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [groups, searchQuery],
  );

  /* ---------------------------------------------------------------- */
  /*  Guard                                                            */
  /* ---------------------------------------------------------------- */

  if (!token || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-10 text-center shadow-2xl backdrop-blur-xl">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--primary))]" />
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Sign in to chat</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Authentication required to access messages.</p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* ============================================================ */}
      {/*  LEFT SIDEBAR                                                 */}
      {/* ============================================================ */}
      <aside
        className={cn(
          'flex w-full flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-xl md:w-[390px] md:shrink-0',
          showMobileChat && 'hidden md:flex',
        )}
      >
        {/* header */}
        <div className="space-y-3 border-b border-[hsl(var(--border))] px-4 pb-3 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">Inbox</h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Chats, friends, and requests</p>
            </div>
            <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFriendRequestsModal(true)}
              className="relative flex items-center justify-center rounded-lg bg-[hsl(var(--muted))]/50 p-2 text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
            >
              <UserCheck size={18} />
              {pendingRequestsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={async () => { setShowBlockedModal(true); try { const res = await api.get('/friendships/blocked'); setBlockedUsers(res.data ?? []); } catch {} }}
              className="relative flex items-center justify-center rounded-lg bg-[hsl(var(--muted))]/50 p-2 text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
              title="Blocked users"
            >
              <Ban size={18} />
            </button>
            </div>
          </div>

          {/* tabs */}
          <div className="flex rounded-xl bg-[hsl(var(--muted))]/60 p-1">
            <button
              onClick={() => setTab('direct')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all duration-200',
                tab === 'direct'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
              )}
            >
              <MessageCircle size={15} /> Direct
            </button>
            <button
              onClick={() => setTab('groups')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all duration-200',
                tab === 'groups'
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
              )}
            >
              <Users size={15} /> Groups
            </button>
          </div>

          {/* search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inbox"
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 pl-9 pr-4 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
            />
          </div>
        </div>

        {/* conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === 'direct' && (
            <>
              {/* Online Users horizontal list */}
              {(onlineUsers.length > 0 || suggestedUsers.length > 0) && (
                <div className="border-b border-[hsl(var(--border))] py-3">
                  <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                    Active now
                  </p>
                  <div className="flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none">
                    {(onlineUsers.length ? onlineUsers : suggestedUsers.slice(0, 8)).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => openDirectChat(u)}
                        className="flex flex-col items-center gap-1 shrink-0 group transition duration-150 active:scale-95 text-center"
                      >
                        <div className="relative">
                          <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size={42} />
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[hsl(var(--background))]",
                            onlineUserIds.includes(u.id) ? "bg-emerald-400" : "bg-gray-400"
                          )} />
                        </div>
                        <span className="max-w-[60px] truncate text-[10px] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition">
                          {u.firstName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredConversations.length === 0 && (
                suggestedUsers.length > 0 && !searchQuery.trim() ? (
                  <div className="border-b border-[hsl(var(--border))] py-3">
                    <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Suggested members
                    </p>
                    {suggestedUsers.slice(0, 12).map((member) => (
                      <button
                        key={member.id}
                        onClick={() => openDirectChat(member)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-[hsl(var(--muted))]/50"
                      >
                        <div className="relative shrink-0">
                          <Avatar src={member.avatarUrl} firstName={member.firstName} lastName={member.lastName} />
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[hsl(var(--background))]",
                            onlineUserIds.includes(member.id) ? "bg-emerald-400" : "bg-gray-400"
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                              {member.firstName} {member.lastName}
                            </span>
                            {member.role && (
                              <span className="shrink-0 rounded-full bg-[hsl(var(--primary))]/10 px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--primary))]">
                                {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">
                            {member.location || member.email || member.phone || 'Start chatting...'}
                          </p>
                        </div>
                        <MessageCircle size={15} className="shrink-0 text-[hsl(var(--primary))]/50" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                    <MessageCircle className="h-10 w-10 text-[hsl(var(--muted-foreground))]/40" />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">No conversations yet</p>
                  </div>
                )
              )}
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-[hsl(var(--muted))]/50',
                    activeChat?.id === conv.recipientId && 'bg-[hsl(var(--primary))]/10 border-l-2 border-[hsl(var(--primary))]',
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar src={conv.avatarUrl} firstName={conv.firstName} lastName={conv.lastName} />
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[hsl(var(--background))]",
                      onlineUserIds.includes(conv.recipientId) ? "bg-emerald-400" : "bg-gray-400"
                    )} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                        {conv.firstName} {conv.lastName}
                      </span>
                      <span className="shrink-0 text-[11px] text-[hsl(var(--muted-foreground))]">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">{conv.lastMessage ?? 'Start chatting…'}</p>
                  </div>
                  {(conv.unread ?? 0) > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[hsl(var(--primary))] px-1.5 text-[10px] font-bold text-[hsl(var(--primary-foreground))]">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}

          {tab === 'groups' && (
            <>
              {filteredGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <Users className="h-10 w-10 text-[hsl(var(--muted-foreground))]/40" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No groups yet</p>
                </div>
              )}
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => selectGroup(group)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 hover:bg-[hsl(var(--muted))]/50',
                    activeChat?.id === group.id && 'bg-[hsl(var(--primary))]/10 border-l-2 border-[hsl(var(--primary))]',
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">{group.name}</span>
                      <span className="shrink-0 text-[11px] text-[hsl(var(--muted-foreground))]">{formatTime(group.lastMessageAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">{group.lastMessage ?? 'No messages yet'}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* new chat FAB */}
          <div className="p-4">
            <button
              onClick={() => setShowUserSearchModal(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/25 transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
            >
              <MessageCircle size={18} /> New Chat
            </button>
          </div>
          {/* new group FAB */}
          <div className="p-4">
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/25 transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
            >
              <Plus size={18} /> New Group
            </button>
          </div>
      </aside>

      {/* ============================================================ */}
      {/*  RIGHT PANE – CHAT                                            */}
      {/* ============================================================ */}
      <main
        className={cn(
          'flex flex-1 flex-col min-w-0 bg-[hsl(var(--background))]',
          !showMobileChat && 'hidden md:flex',
        )}
      >
        {!activeChat ? (
          /* empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]/10">
              <MessageCircle className="h-10 w-10 text-[hsl(var(--primary))]" />
            </div>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Select a conversation</h2>
            <p className="max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
              Choose a chat from the sidebar to start messaging, or create a new group.
            </p>
          </div>
        ) : (
          <>
            {/* chat header */}
            <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 px-4 py-3 backdrop-blur-xl">
              {/* mobile back */}
              <button
                onClick={() => { setShowMobileChat(false); setActiveChat(null); }}
                className="mr-1 rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 md:hidden"
              >
                <ArrowLeft size={20} />
              </button>

              <button onClick={async () => {
                if (!activeChat || activeChat.isGroup) return;
                try {
                  const res = await api.get(`/users/${activeChat.id}`);
                  setProfileUser(res.data);
                  setShowProfileModal(true);
                } catch { /* ignore */ }
              }} className="rounded-full">
                <Avatar src={activeChat.avatarUrl} firstName={activeChat.name.split(' ')[0]} lastName={activeChat.name.split(' ')[1]} />
              </button>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">{activeChat.name}</h3>
                <div className="flex items-center gap-1.5">
                  {activeChat.isGroup ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-sky-400" />
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">Group Conversation</span>
                    </>
                  ) : (
                    <>
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        onlineUserIds.includes(activeChat.id) ? "bg-emerald-400" : "bg-gray-400"
                      )} />
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        {onlineUserIds.includes(activeChat.id) ? 'Online' : (
                          (() => {
                            const u = suggestedUsers.find(s => s.id === activeChat.id) || onlineUsers.find(s => s.id === activeChat.id);
                            if (u && (u as any).lastSeen) return `Last seen ${formatTime((u as any).lastSeen)}`;
                            return 'Offline';
                          })()
                        )}
                      </span>
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">·</span>
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        {activeFriendshipStatus === 'ACCEPTED'
                          ? 'Friends'
                          : activeFriendshipStatus === 'PENDING_SENT'
                          ? 'Request sent'
                          : activeFriendshipStatus === 'PENDING_RECEIVED'
                          ? 'Wants to connect'
                          : activeFriendshipStatus === 'BLOCKED'
                          ? 'Blocked'
                          : 'Not friends'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* action buttons */}
              {!activeChat.isGroup && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startCall('audio')}
                    disabled={activeFriendshipStatus !== 'ACCEPTED'}
                    className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))] disabled:cursor-not-allowed disabled:opacity-40"
                    title="Audio call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => startCall('video')}
                    disabled={activeFriendshipStatus !== 'ACCEPTED'}
                    className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))] disabled:cursor-not-allowed disabled:opacity-40"
                    title="Video call"
                  >
                    <Video size={18} />
                  </button>
                  {activeFriendshipStatus === 'PENDING_RECEIVED' && (
                    <button
                      onClick={handleAcceptActiveRequest}
                      className="hidden rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition hover:opacity-90 sm:inline-flex"
                    >
                      Accept
                    </button>
                  )}
                  
                  <div className="ml-2">
                    <ThemeSelector />
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]"
                      title="Options"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showOptionsMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowOptionsMenu(false)} />
                        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 shadow-lg backdrop-blur-xl">
                          <button
                            onClick={handleAddFriend}
                            disabled={activeFriendshipStatus === 'ACCEPTED' || activeFriendshipStatus === 'PENDING_SENT' || activeFriendshipStatus === 'SELF' || activeFriendshipStatus === 'BLOCKED'}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
                          >
                            <UserPlus size={14} />
                            {activeFriendshipStatus === 'ACCEPTED'
                              ? 'Already Friends'
                              : activeFriendshipStatus === 'PENDING_SENT'
                              ? 'Request Sent'
                              : activeFriendshipStatus === 'PENDING_RECEIVED'
                              ? 'Accept Request'
                              : 'Add Friend'}
                          </button>
                          <button
                            onClick={handleBlockUser}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
                          >
                            <Ban size={14} /> Block User
                          </button>
                           <button
                             onClick={() => {
                               if (confirm("Delete this conversation? This will remove it from your inbox.")) {
                                 api.delete(`/chat/conversations/${activeChat.id}`).then(() => {
                                   toast.success("Conversation deleted");
                                   setConversations(prev => prev.filter(c => c.recipientId !== activeChat.id));
                                   setActiveChat(null);
                                   setShowMobileChat(false);
                                   setShowOptionsMenu(false);
                                 }).catch(() => toast.error("Failed to delete conversation"));
                               }
                             }}
                             className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
                           >
                             <X size={14} /> Delete Chat
                           </button>
                          <button
                            onClick={() => { setShowReportModal(true); setShowOptionsMenu(false); }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
                          >
                            <Flag size={14} /> Report
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <MessageCircle className="h-8 w-8 text-[hsl(var(--muted-foreground))]/30" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No messages yet. Say hello!</p>
                </div>
              )}

              {messages.map((msg) => {
                const isMine = msg.senderId === user.id;
                const isSelected = selectedMessageId === msg.id;
                const bubbleBase = bubbleShape === 'pill' ? 'rounded-full' : bubbleShape === 'square' ? 'rounded-md' : bubbleShape === 'asym' ? 'rounded-tl-2xl rounded-tr-2xl' : 'rounded-2xl';
                return (
                  <div
                    key={msg.id}
                    className={cn('mb-3 flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}
                    onPointerDown={() => beginMessagePress(msg.id)}
                    onPointerUp={cancelMessagePress}
                    onPointerLeave={cancelMessagePress}
                    onPointerCancel={cancelMessagePress}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setSelectedMessageId(msg.id);
                    }}
                  >
                    {/* sender avatar (group, not mine) */}
                    {!isMine && activeChat.isGroup && (
                      <Avatar
                        src={msg.sender?.avatarUrl}
                        firstName={msg.sender?.firstName}
                        lastName={msg.sender?.lastName}
                        size={28}
                      />
                    )}

                    <div className={cn('min-w-0 max-w-[75%] md:max-w-[55%]')}>
                      {/* sender name in group */}
                      {!isMine && activeChat.isGroup && msg.sender && (
                        <p className="mb-0.5 ml-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          {msg.sender.firstName} {msg.sender.lastName}
                        </p>
                      )}

                      <div
                        className={cn(
                          `${bubbleBase} px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all`,
                          isMine
                            ? 'bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] rounded-br-md'
                            : 'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border border-[hsl(var(--border))]/50 rounded-bl-md',
                        )}
                      >
                        {/* file attachment */}
                        {msg.fileUrl && (
                          <div className="mb-2 chat-media">
                            {isImageFile(msg.fileUrl, msg.fileType) ? (
                              <img
                                src={msg.fileUrl}
                                alt="Attachment"
                                className="max-h-52 rounded-lg object-cover"
                                loading="lazy"
                              />
                            ) : isAudioFile(msg.fileType) ? (
                              <audio controls src={msg.fileUrl} className="max-w-full" />
                            ) : isVideoFile(msg.fileType) ? (
                              <video controls src={msg.fileUrl} className="max-h-64 max-w-full rounded-lg" />
                            ) : (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium underline-offset-2 hover:underline',
                                  isMine
                                    ? 'bg-white/15 text-[hsl(var(--primary-foreground))]'
                                    : 'bg-[hsl(var(--muted))]/60 text-[hsl(var(--foreground))]',
                                )}
                              >
                                <Paperclip size={14} />
                                {msg.content || 'Download file'}
                              </a>
                            )}
                          </div>
                        )}

                        {/* text content (skip if it's just a filename for a file message) */}
                        {(!msg.fileUrl || msg.content !== msg.fileUrl) && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                        <p
                          className={cn(
                            'mt-1 text-right text-[10px]',
                            isMine ? 'text-[hsl(var(--primary-foreground))]/60' : 'text-[hsl(var(--muted-foreground))]',
                          )}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>

                      {/* reactions & actions toolbar */}
                      <div className={cn('mt-1 flex items-center gap-2 text-xs', !isSelected && !msg.reactions?.length && 'hidden')}>
                        {/* show reactions */}
                        {(msg as any).reactions && Array.isArray((msg as any).reactions) && (
                          <div className="flex items-center gap-1">
                            {((msg as any).reactions as any[]).slice(0,5).map((r, idx) => (
                              <span key={idx} className="rounded-full bg-[hsl(var(--muted))]/40 px-2 py-0.5">{r.emoji}</span>
                            ))}
                          </div>
                        )}

                        {/* quick react buttons - only show on long press */}
                        {isSelected && (
                        <div className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1 shadow-sm">
                          {['👍','❤️','😂','🔥','😮'].map(e => (
                            <button key={e} onClick={() => { socketRef.current?.emit('reactMessage', { messageId: msg.id, emoji: e }); }} className="rounded px-1 hover:bg-[hsl(var(--muted))]/30">{e}</button>
                          ))}
                        </div>
                        )}

                        {/* edit / delete actions for own messages */}
                        {isMine && isSelected && (
                          <div className="ml-auto flex items-center gap-1">
                            <button onClick={() => {
                              // allow edit only within 10s
                              const created = new Date(msg.createdAt).getTime();
                              if (Date.now() - created > 10000) { toast.error('Edit window expired'); return; }
                              setEditingMessageId(msg.id);
                              setMessageInput(msg.content);
                            }} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Edit</button>
                            <button onClick={() => { if (confirm('Delete this message for everyone?')) { deleteMessage(msg.id); } }} className="text-red-500 hover:opacity-80">Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingUserIds.length > 0 && (
                <div className="mb-3 flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))] px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] shadow-sm">
                    Typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* input area */}
            <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 px-4 py-3 backdrop-blur-xl">
              {!activeChat.isGroup && activeFriendshipStatus !== 'ACCEPTED' ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      {activeFriendshipStatus === 'PENDING_SENT'
                        ? 'Friend request sent'
                        : activeFriendshipStatus === 'PENDING_RECEIVED'
                        ? `${activeChat.name} sent you a request`
                        : 'Connect to start chatting'}
                    </p>
                    <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">Messages unlock after the request is accepted.</p>
                  </div>
                  {activeFriendshipStatus === 'PENDING_RECEIVED' ? (
                    <button
                      onClick={handleAcceptActiveRequest}
                      className="shrink-0 rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))]"
                    >
                      Accept
                    </button>
                  ) : activeFriendshipStatus === 'NONE' ? (
                    <button
                      onClick={handleAddFriend}
                      className="shrink-0 rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))]"
                    >
                      Add
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="relative flex items-end gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 shadow-sm">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={cn(
                        'shrink-0 rounded-full p-2.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]',
                        uploading && 'animate-pulse',
                      )}
                      title="Attach file"
                    >
                      <Paperclip size={18} />
                    </button>

                    <button
                      onClick={() => setShowStickerPicker((v) => !v)}
                      className="shrink-0 rounded-full p-2.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/60"
                      title="Stickers"
                    >
                      <Plus size={18} />
                    </button>
                    {showStickerPicker && (
                      <div className="absolute bottom-20 right-6 left-auto z-50 w-80 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-lg">
                        <div className="mb-2 flex items-center gap-2">
                          <input value={stickerQuery} onChange={(e) => setStickerQuery(e.target.value)} placeholder="Search GIFs..." className="flex-1 rounded-md border px-2 py-1 text-sm" />
                        </div>

                        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-auto">
                          {giphyResults && giphyResults.length > 0 ? (
                            giphyResults.map((g: any) => (
                              <button key={g.id} onClick={() => { sendMessage('', g.images.fixed_width.url, 'image/gif'); setShowStickerPicker(false); }} className="rounded p-0.5">
                                <img src={g.images.fixed_width.url} alt="gif" className="h-20 w-full object-cover rounded" />
                              </button>
                            ))
                          ) : (
                            STICKERS.map((s) => (
                              <button key={s} onClick={() => { sendMessage('', s, 'image/png'); setShowStickerPicker(false); }} className="rounded p-0.5">
                                <img src={s} alt="sticker" className="h-12 w-12 object-cover rounded" />
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* voice recorder */}
                  <button
                    onClick={handleVoiceRecordToggle}
                    disabled={recording && !mediaRecorder}
                    className={cn('shrink-0 rounded-full p-2.5', recording ? 'bg-red-500 text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]')}
                    title={recording ? 'Stop recording' : 'Record voice message'}
                  >
                    {recording ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <div className="flex-1">
                    {attachment ? (
                      <div className="mb-2 flex items-start gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2">
                        <div className="shrink-0">
                          {isImageFile(attachment.url, attachment.fileType) ? (
                            <img src={attachment.url} className="h-20 w-20 rounded-md object-cover" alt="preview" />
                          ) : isAudioFile(attachment.fileType) ? (
                            <audio controls src={attachment.url} className="h-10" />
                          ) : isVideoFile(attachment.fileType) ? (
                            <video controls src={attachment.url} className="h-20 w-28 rounded-md object-cover" />
                          ) : (
                            <a href={attachment.url} target="_blank" rel="noreferrer" className="text-sm underline">{attachment.fileName}</a>
                          )}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={messageInput}
                            onChange={(e) => handleMessageInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add a caption..."
                            rows={1}
                            className="max-h-28 min-h-10 w-full resize-none bg-transparent px-2 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
                          />
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={messageInput}
                        onChange={(e) => handleMessageInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message..."
                        rows={1}
                        className="max-h-28 min-h-10 w-full resize-none bg-transparent px-2 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
                      />
                    )}

                    {/* send */}
                    <div className="mt-2 flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                        <input type="checkbox" checked={viewOnce} onChange={(e) => setViewOnce(e.target.checked)} className="accent-[hsl(var(--primary))]" />
                        View once
                      </label>
                      <button
                        onClick={handleSend}
                        disabled={!messageInput.trim() && !attachment}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md shadow-[hsl(var(--primary))]/25 transition-all duration-200 hover:shadow-lg disabled:opacity-40 disabled:shadow-none active:scale-95"
                      >
                        <Send size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ============================================================ */}
      {/*  CREATE GROUP MODAL                                           */}
      {/* ============================================================ */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowGroupModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Create Group</h3>
              <button onClick={() => setShowGroupModal(false)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60">
                <X size={18} />
              </button>
            </div>

            {/* group name */}
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Group name</label>
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Tenants Building A"
              className="mb-4 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-4 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
            />

            {/* add members */}
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Add members (user ID)</label>
            <div className="mb-3 flex gap-2">
              <input
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMemberId(); } }}
                placeholder="Paste user ID"
                className="h-10 flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-4 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
              />
              <button
                onClick={addMemberId}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary))]/25"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* member chips */}
            {memberIds.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {memberIds.map((mid) => (
                  <span key={mid} className="flex items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))]">
                    {mid.slice(0, 8)}…
                    <button onClick={() => setMemberIds((prev) => prev.filter((x) => x !== mid))} className="ml-0.5 text-[hsl(var(--muted-foreground))] hover:text-red-500">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* create button */}
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || memberIds.length === 0}
              className="h-11 w-full rounded-xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/25 transition-all duration-200 hover:shadow-xl disabled:opacity-40 disabled:shadow-none active:scale-[0.98]"
            >
              Create Group
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  CALL OVERLAY                                                 */}
      {/* ============================================================ */}
      {callState !== 'idle' && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[hsl(var(--background))]/95 backdrop-blur-2xl">
          {/* incoming call notice */}
          {callState === 'incoming' && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(var(--primary))]/20" />
                <span className="absolute inset-2 animate-pulse rounded-full bg-[hsl(var(--primary))]/15" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20">
                  {callType === 'video' ? <Video className="h-10 w-10 text-[hsl(var(--primary))]" /> : <Phone className="h-10 w-10 text-[hsl(var(--primary))]" />}
                </div>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[hsl(var(--foreground))]">Incoming {callType} call</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{callTargetName}</p>
              </div>
              <div className="flex gap-6">
                <button
                  onClick={endCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600 active:scale-95"
                >
                  <PhoneOff size={24} />
                </button>
                <button
                  onClick={acceptCall}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 active:scale-95"
                >
                  <Phone size={24} />
                </button>
              </div>
            </div>
          )}

          {/* calling / active */}
          {(callState === 'calling' || callState === 'active') && (
            <div className="flex h-full w-full flex-col">
              {/* video area */}
              <div className="relative flex flex-1 items-center justify-center bg-black/30">
                {/* remote */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={cn(
                    'h-full w-full object-contain',
                    callType === 'audio' && 'hidden',
                  )}
                />
                <audio ref={remoteAudioRef} autoPlay className="hidden" />
                {callType === 'audio' && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20">
                      <Phone className="h-10 w-10 text-[hsl(var(--primary))]" />
                    </div>
                    <p className="text-lg font-bold text-[hsl(var(--foreground))]">{callTargetName}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {callState === 'calling' ? 'Calling…' : 'Connected'}
                    </p>
                  </div>
                )}

                {/* local PiP */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    'absolute bottom-4 right-4 h-20 w-16 sm:h-32 sm:w-24 rounded-xl object-cover shadow-lg ring-2 ring-[hsl(var(--border))]',
                    callType === 'audio' && 'hidden',
                  )}
                />

                {callState === 'calling' && callType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
                      <p className="text-sm font-medium text-white">Calling {callTargetName}…</p>
                    </div>
                  </div>
                )}
              </div>

              {/* call controls */}
              <div className="flex items-center justify-center gap-5 bg-[hsl(var(--card))]/80 py-5 backdrop-blur-xl">
                <button
                  onClick={toggleMic}
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full transition shadow-md',
                    micEnabled
                      ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                      : 'bg-red-500/20 text-red-500',
                  )}
                >
                  {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                {callType === 'video' && (
                  <button
                    onClick={toggleCam}
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full transition shadow-md',
                      camEnabled
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                        : 'bg-red-500/20 text-red-500',
                    )}
                  >
                    {camEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} />}
                  </button>
                )}

                <button
                  onClick={endCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600 active:scale-95"
                >
                  <PhoneOff size={22} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  Custom scrollbar styles                                      */}
      {/* ============================================================ */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 9999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground));
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) transparent;
        }
        /* Ensure media and embedded elements scale within chat containers */
        .chat-media img, .chat-media video, .chat-media audio {
          max-width: 100%;
          height: auto;
          display: block;
        }
        /* Prevent flex children from causing horizontal overflow */
        .min-w-0 { min-width: 0; }
      `}</style>

      {/* ============================================================ */}
      {/*  REPORT MODAL                                                 */}
      {/* ============================================================ */}
      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Report User</h3>
              <button onClick={() => setShowReportModal(false)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60">
                <X size={18} />
              </button>
            </div>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mb-4 h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
            >
              <option value="Harassment">Harassment</option>
              <option value="Spam">Spam</option>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Fraud/Scam">Fraud/Scam</option>
              <option value="Other">Other</option>
            </select>
            <label className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Description (optional)</label>
            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="Provide more details..."
              className="mb-5 min-h-[80px] w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3 text-sm text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
            />
            <button
              onClick={submitReport}
              className="h-11 w-full rounded-xl bg-red-500 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:bg-red-600 active:scale-[0.98]"
            >
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  FRIEND REQUESTS MODAL                                        */}
      {/* ============================================================ */}
      {showFriendRequestsModal && (
        <FriendRequestsModal onClose={() => { setShowFriendRequestsModal(false); api.get('/friendships/pending').then(res => setPendingRequestsCount(res.data?.length ?? 0)).catch(()=>{}); }} />
      )}

      {/* ============================================================ */}
      {/*  PROFILE MODAL                                                 */}
      {/* ============================================================ */}
      {showProfileModal && profileUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowProfileModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{profileUser.firstName} {profileUser.lastName}</h3>
              <button onClick={() => setShowProfileModal(false)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              {profileUser.avatarUrl ? <img src={profileUser.avatarUrl} alt="avatar" className="h-48 w-48 rounded-full object-cover" /> : (
                <div className="h-48 w-48 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center text-3xl font-bold">{initials(profileUser.firstName, profileUser.lastName)}</div>
              )}
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{profileUser.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  BLOCKED USERS MODAL                                          */}
      {/* ============================================================ */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowBlockedModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-4 w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">Blocked Users</h3>
              <button onClick={() => setShowBlockedModal(false)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60">
                <X size={18} />
              </button>
            </div>
            <div className="mb-4 max-h-72 overflow-y-auto">
              {blockedUsers.length === 0 && <p className="text-sm text-[hsl(var(--muted-foreground))]">No blocked users.</p>}
              {blockedUsers.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex items-center gap-3">
                    <Avatar src={b.avatarUrl} firstName={b.firstName} lastName={b.lastName} />
                    <div>
                      <div className="text-sm font-medium text-[hsl(var(--foreground))]">{b.firstName} {b.lastName}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{b.email}</div>
                    </div>
                  </div>
                  <div>
                    <button onClick={async () => {
                      try {
                        await api.delete(`/friendships/block/${b.id}`);
                        setBlockedUsers((prev) => prev.filter((x) => x.id !== b.id));
                        toast.success('User unblocked');
                      } catch { toast.error('Failed to unblock user'); }
                    }} className="rounded-lg bg-[hsl(var(--primary))] px-3 py-1 text-sm text-[hsl(var(--primary-foreground))]">Unblock</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  USER SEARCH MODAL – "New Chat"                               */}
      {/* ============================================================ */}
      {showUserSearchModal && (
        <UserSearchModal
          friendsOnly={false}
          onClose={() => setShowUserSearchModal(false)}
          onSelectUser={(selectedUser) => {
            openDirectChat(selectedUser);
          }}
        />
      )}
    </div>
  );
}

