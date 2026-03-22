import { create } from 'zustand';

interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface ChatState {
  messages: Record<string, Message[]>;
  addMessage: (roomId: string, message: Message) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  clearRoom: (roomId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  addMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    })),
  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    })),
  clearRoom: (roomId) =>
    set((state) => {
      const { [roomId]: _, ...rest } = state.messages;
      return { messages: rest };
    }),
}));
