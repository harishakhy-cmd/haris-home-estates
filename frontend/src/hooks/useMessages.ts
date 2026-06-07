import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  groupId?: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  voiceUrl?: string;
  voiceDuration?: number;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export function useMessages(recipientId?: string, groupId?: string) {
  const { socket, isAuthenticated } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewMessage = (message: Message) => {
      // Only add if it's for this conversation
      if (
        (recipientId && message.recipientId === recipientId) ||
        (groupId && message.groupId === groupId)
      ) {
        setMessages((prev) => [...prev, message]);

        // Auto-mark as read for one-to-one chats
        if (recipientId && message.recipientId === recipientId) {
          socket.emit('messageRead', { messageId: message.id });
        }
      }
    };

    const handleTyping = (data: any) => {
      if (
        (recipientId && data.recipientId === recipientId) ||
        (groupId && data.groupId === groupId)
      ) {
        if (data.isTyping) {
          setTypingUsers((prev) => new Set([...prev, data.senderId]));
        } else {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.senderId);
            return newSet;
          });
        }
      }
    };

    const handleMessageDeleted = (data: any) => {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== data.messageId),
      );
    };

    const handleMessageEdited = (data: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.id ? { ...msg, ...data } : msg,
        ),
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageEdited', handleMessageEdited);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageEdited', handleMessageEdited);
    };
  }, [socket, isAuthenticated, recipientId, groupId]);

  const sendMessage = useCallback(
    async (content: string, options?: any) => {
      if (!socket || !isAuthenticated) {
        console.error('Socket not ready');
        return;
      }

      if (!recipientId && !groupId) {
        console.error('No recipient or group specified');
        return;
      }

      return new Promise((resolve, reject) => {
        socket.emit(
          'sendMessage',
          {
            recipientId,
            groupId,
            content,
            ...options,
          },
          (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          },
        );
      });
    },
    [socket, isAuthenticated, recipientId, groupId],
  );

  const markAsRead = useCallback(async () => {
    if (!socket || !isAuthenticated) return;

    if (recipientId) {
      socket.emit('markRead', { senderId: recipientId });
    }
  }, [socket, isAuthenticated, recipientId]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !isAuthenticated) return;

      socket.emit('typing', {
        recipientId,
        groupId,
        isTyping,
      });
    },
    [socket, isAuthenticated, recipientId, groupId],
  );

  const reactMessage = useCallback(
    (messageId: string, emoji: string) => {
      if (!socket || !isAuthenticated) return;

      socket.emit('reactMessage', { messageId, emoji });
    },
    [socket, isAuthenticated],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socket || !isAuthenticated) return;

      socket.emit('deleteMessage', { messageId });
    },
    [socket, isAuthenticated],
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!socket || !isAuthenticated) return;

      socket.emit('editMessage', { messageId, content });
    },
    [socket, isAuthenticated],
  );

  return {
    messages,
    isTyping: typingUsers.size > 0,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    markAsRead,
    emitTyping,
    reactMessage,
    deleteMessage,
    editMessage,
  };
}
