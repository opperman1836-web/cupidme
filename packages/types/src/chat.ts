export type ChatRoomStatus = 'active' | 'expired' | 'extended' | 'closed';
export type MessageType = 'text' | 'image' | 'voice_note' | 'system';
export type ModerationStatus = 'clean' | 'flagged' | 'blocked';

export interface ChatRoom {
  id: string;
  match_id: string;
  status: ChatRoomStatus;
  expires_at: string;
  extended_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface SendMessageInput {
  chat_room_id: string;
  content: string;
  message_type?: MessageType;
}

export interface ChatRoomWithMessages extends ChatRoom {
  messages: Message[];
  other_user: {
    id: string;
    display_name: string;
    primary_photo_url: string | null;
  };
}

export const CHAT_DURATION_HOURS = 48;
export const CHAT_EXTENSION_HOURS = 24;
