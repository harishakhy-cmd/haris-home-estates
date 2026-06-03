'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { UserSearchModal } from '@/components/layout/user-search-modal';
import { FriendRequestsModal } from '@/components/layout/friend-requests-modal';
import { toast } from 'sonner';




/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  groupId?: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
  createdAt: string;
  sender?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null };
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

export default function ChatPage() {
  /* auth */
  const { user, token, hydrate } = useAuthStore();
  useEffect(() => { hydrate(); }, [hydrate]);

  /* socket ref */
  const socketRef = useRef<Socket | null>(null);

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
  
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const onlineUserIds = onlineUsers.map((u) => u.id);

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);



  /* group modal */
  const [newGroupName, setNewGroupName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);

  /* file upload */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  /* call state */
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'active'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callTargetId, setCallTargetId] = useState<string | null>(null);
  const [callTargetName, setCallTargetName] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
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
  // Fetch online users list
  api.get('/users/online')
    .then(res => setOnlineUsers(res.data ?? []))
    .catch(() => setOnlineUsers([]));
    
  api.get('/friendships/pending')
    .then(res => setPendingRequestsCount(res.data?.length ?? 0))
    .catch(() => setPendingRequestsCount(0));
}, [token]);

useEffect(() => {
  if (!token) return;
  fetchConversations();
  fetchGroups();
}, [token, fetchConversations, fetchGroups]);

  /* ---------------------------------------------------------------- */
  /*  Socket setup                                                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!token || !user) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });

    if (socket.connected) {
      socket.emit('authenticate', token);
    }

    socket.on('newMessage', (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      /* refresh sidebar */
      fetchConversations();
      fetchGroups();
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
      .then((res) => setMessages(res.data ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [activeChat]);

  /* ---------------------------------------------------------------- */
  /*  Send message                                                     */
  /* ---------------------------------------------------------------- */

  const sendMessage = useCallback(
    (content: string, fileUrl?: string, fileType?: string) => {
      const socket = socketRef.current;
      if (!socket || !activeChat) return;
      const payload: Record<string, unknown> = { content };
      if (fileUrl) {
        payload.fileUrl = fileUrl;
        payload.fileType = fileType;
      }
      if (activeChat.isGroup) {
        payload.groupId = activeChat.id;
      } else {
        payload.recipientId = activeChat.id;
      }
      const optimisticId = `temp-${Date.now()}`;
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
    },
    [activeChat, user?.id],
  );

  const handleSend = () => {
    const text = messageInput.trim();
    if (!text) return;
    sendMessage(text);
    setMessageInput('');
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
      sendMessage(file.name, url, file.type);
    } catch { /* ignore */ }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const selectConversation = (conv: Conversation) => {
    setActiveChat({ id: conv.recipientId, isGroup: false, name: `${conv.firstName} ${conv.lastName}`, avatarUrl: conv.avatarUrl });
    setShowMobileChat(true);
  };

  const selectGroup = (group: Group) => {
    setActiveChat({ id: group.id, isGroup: true, name: group.name });
    setShowMobileChat(true);
  };

  /* ---------------------------------------------------------------- */
  /*  WebRTC                                                           */
  /* ---------------------------------------------------------------- */

  const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

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
  }, []);

  const createPeerConnection = useCallback(
    (targetId: string) => {
      const socket = socketRef.current;
      if (!socket) return null;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('webrtcIceCandidate', { targetId, candidate: e.candidate.toJSON() });
        }
      };
      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          cleanupCall();
        }
      };
      peerConnectionRef.current = pc;
      return pc;
    },
    [cleanupCall],
  );

  const startCall = useCallback(
    async (type: 'audio' | 'video') => {
      if (!activeChat || activeChat.isGroup) return;
      setCallType(type);
      setCallTargetId(activeChat.id);
      setCallTargetName(activeChat.name);
      setCallState('calling');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = createPeerConnection(activeChat.id);
        if (!pc) return;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('webrtcOffer', {
          targetId: activeChat.id,
          offer: pc.localDescription,
          callType: type,
        });
      } catch {
        cleanupCall();
      }
    },
    [activeChat, createPeerConnection, cleanupCall],
  );

  const acceptCall = useCallback(async () => {
    const pending = pendingOfferRef.current;
    if (!pending) return;
    setCallState('active');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(pending.senderId);
      if (!pc) return;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pending.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('webrtcAnswer', { targetId: pending.senderId, answer: pc.localDescription });
      pendingOfferRef.current = null;
    } catch {
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
      await api.post(`/friendships/request/${activeChat.id}`);
      toast.success('Friend request sent!');
      setShowOptionsMenu(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
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
          'flex w-full flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-xl md:w-[380px] md:shrink-0',
          showMobileChat && 'hidden md:flex',
        )}
      >
        {/* header */}
        <div className="space-y-3 border-b border-[hsl(var(--border))] px-4 pb-3 pt-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">Messages</h1>
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
              placeholder="Search conversations…"
              className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 pl-9 pr-4 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
            />
          </div>
        </div>

        {/* conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === 'direct' && (
            <>
              {/* Online Users horizontal list */}
              {onlineUsers.length > 0 && (
                <div className="border-b border-[hsl(var(--border))] py-3">
                  <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                    Online Now ({onlineUsers.length})
                  </p>
                  <div className="flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none">
                    {onlineUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setActiveChat({
                            id: u.id,
                            isGroup: false,
                            name: `${u.firstName} ${u.lastName}`,
                            avatarUrl: u.avatarUrl,
                          });
                          setShowMobileChat(true);
                          setConversations((prev) => {
                            if (prev.some((c) => c.recipientId === u.id)) return prev;
                            return [
                              {
                                id: `conv-${u.id}`,
                                recipientId: u.id,
                                firstName: u.firstName,
                                lastName: u.lastName,
                                avatarUrl: u.avatarUrl,
                                lastMessage: undefined,
                                lastMessageAt: undefined,
                                unread: 0,
                              },
                              ...prev,
                            ];
                          });
                        }}
                        className="flex flex-col items-center gap-1 shrink-0 group transition duration-150 active:scale-95 text-center"
                      >
                        <div className="relative">
                          <Avatar src={u.avatarUrl} firstName={u.firstName} lastName={u.lastName} size={42} />
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[hsl(var(--background))]" />
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
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <MessageCircle className="h-10 w-10 text-[hsl(var(--muted-foreground))]/40" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No conversations yet</p>
                </div>
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
          'flex flex-1 flex-col bg-[hsl(var(--background))]',
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

              <Avatar src={activeChat.avatarUrl} firstName={activeChat.name.split(' ')[0]} lastName={activeChat.name.split(' ')[1]} />

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
                        {onlineUserIds.includes(activeChat.id) ? "Online" : "Offline"}
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
                    className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]"
                    title="Audio call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => startCall('video')}
                    className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]"
                    title="Video call"
                  >
                    <Video size={18} />
                  </button>
                  
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
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
                          >
                            <UserPlus size={14} /> Add Friend
                          </button>
                          <button
                            onClick={handleBlockUser}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
                          >
                            <Ban size={14} /> Block User
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
                return (
                  <div key={msg.id} className={cn('mb-3 flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
                    {/* sender avatar (group, not mine) */}
                    {!isMine && activeChat.isGroup && (
                      <Avatar
                        src={msg.sender?.avatarUrl}
                        firstName={msg.sender?.firstName}
                        lastName={msg.sender?.lastName}
                        size={28}
                      />
                    )}

                    <div className={cn('max-w-[75%] md:max-w-[55%]')}>
                      {/* sender name in group */}
                      {!isMine && activeChat.isGroup && msg.sender && (
                        <p className="mb-0.5 ml-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          {msg.sender.firstName} {msg.sender.lastName}
                        </p>
                      )}

                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all',
                          isMine
                            ? 'bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] rounded-br-md'
                            : 'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border border-[hsl(var(--border))]/50 rounded-bl-md',
                        )}
                      >
                        {/* file attachment */}
                        {msg.fileUrl && (
                          <div className="mb-2">
                            {isImageFile(msg.fileUrl, msg.fileType) ? (
                              <img
                                src={msg.fileUrl}
                                alt="Attachment"
                                className="max-h-52 rounded-lg object-cover"
                                loading="lazy"
                              />
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
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* input area */}
            <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 px-4 py-3 backdrop-blur-xl">
              <div className="flex items-end gap-2">
                {/* attach */}
                                {/* attach */}
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={cn(
                    'shrink-0 rounded-xl p-2.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]',
                    uploading && 'animate-pulse',
                  )}
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                {/* voice recorder */}
                <button
                  onClick={() => {
                    if (!recording) {
                      // start recording
                      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                        const mr = new MediaRecorder(stream);
                        const chunks: Blob[] = [];
                        mr.ondataavailable = e => chunks.push(e.data);
                        mr.onstop = () => {
                          const blob = new Blob(chunks, { type: 'audio/webm' });
                          const fd = new FormData();
                          fd.append('file', blob, 'voice-message.webm');
                          api.post('/chat/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => {
                            const url = res.data?.url ?? res.data;
                            sendMessage('Voice Message', url, 'audio/webm');
                          }).finally(() => {
                            setRecording(false);
                            setMediaRecorder(null);
                          });
                        };
                        mr.start();
                        setMediaRecorder(mr);
                        setRecording(true);
                      });
                    } else {
                      // stop recording
                      mediaRecorder?.stop();
                    }
                  }}
                  disabled={recording && !mediaRecorder}
                  className={cn(
                    'shrink-0 rounded-xl p-2.5',
                    recording ? 'bg-red-500 text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]'
                  )}
                  title={recording ? 'Stop recording' : 'Record voice message'}
                >
                  {recording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  className={cn(
                    'shrink-0 rounded-xl p-2.5 text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]',
                    uploading && 'animate-pulse',
                  )}
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>



                {/* send */}
                <button
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md shadow-[hsl(var(--primary))]/25 transition-all duration-200 hover:shadow-lg disabled:opacity-40 disabled:shadow-none active:scale-95"
                >
                  <Send size={17} />
                </button>
              </div>
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
                    'h-full w-full object-cover',
                    callType === 'audio' && 'hidden',
                  )}
                />
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
                    'absolute bottom-4 right-4 h-32 w-24 rounded-xl object-cover shadow-lg ring-2 ring-[hsl(var(--border))]',
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
      {/*  USER SEARCH MODAL – "New Chat"                               */}
      {/* ============================================================ */}
      {showUserSearchModal && (
        <UserSearchModal
          friendsOnly={false}
          onClose={() => setShowUserSearchModal(false)}
          onSelectUser={(selectedUser) => {
            /* Immediately open a direct chat with this user */
            setActiveChat({
              id: selectedUser.id,
              isGroup: false,
              name: `${selectedUser.firstName} ${selectedUser.lastName}`,
              avatarUrl: selectedUser.avatarUrl,
            });
            setShowMobileChat(true);
            /* Add to conversations sidebar if not already present */
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
          }}
        />
      )}
    </div>
  );
}
