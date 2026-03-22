import { supabaseAdmin } from '../config/supabase';
import { claude } from '../config/claude';
import { AppError, NotFoundError } from '../utils/errors';
import { chatExpiresAt, chatExtendedExpiresAt } from '../utils/helpers';
import { relationshipService } from './relationship.service';
import { logger } from '../utils/logger';

export class ChatService {
  async startChat(matchId: string, userId: string) {
    // Verify match is unlocked and user belongs to it
    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) throw new NotFoundError('Match');
    if (match.user_a_id !== userId && match.user_b_id !== userId) {
      throw new AppError('Not your match', 403);
    }
    if (match.status !== 'unlocked') {
      throw new AppError('Match must be unlocked before chatting');
    }

    // Check if chat room already exists
    const { data: existing } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (existing) return existing;

    const expires = chatExpiresAt();

    const { data: room, error } = await supabaseAdmin
      .from('chat_rooms')
      .insert({ match_id: matchId, expires_at: expires })
      .select()
      .single();

    if (error) throw new AppError(error.message);

    // Update match
    await supabaseAdmin
      .from('matches')
      .update({ chat_started_at: new Date().toISOString(), chat_expires_at: expires })
      .eq('id', matchId);

    return room;
  }

  async sendMessage(chatRoomId: string, senderId: string, content: string, messageType = 'text') {
    // Verify room is active
    const { data: room } = await supabaseAdmin
      .from('chat_rooms')
      .select('*, matches(*)')
      .eq('id', chatRoomId)
      .single();

    if (!room) throw new NotFoundError('Chat room');
    if (room.status === 'expired' || room.status === 'closed') {
      throw new AppError('Chat has expired. Extend to continue.');
    }
    if (new Date(room.expires_at) < new Date()) {
      // Auto-expire
      await supabaseAdmin
        .from('chat_rooms')
        .update({ status: 'expired' })
        .eq('id', chatRoomId);
      throw new AppError('Chat has expired. Extend to continue.');
    }

    // Moderate content
    const moderationStatus = await this.moderateMessage(content);

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        sender_id: senderId,
        content,
        message_type: messageType,
        moderation_status: moderationStatus,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message);

    if (moderationStatus === 'blocked') {
      throw new AppError('Message blocked due to content policy violation');
    }

    // Track relationship event
    if (room.matches) {
      await relationshipService.recordEvent(room.matches.id, 'message_sent');
    }

    return message;
  }

  async getMessages(chatRoomId: string, userId: string, page = 1, limit = 50) {
    // Verify user belongs to this chat
    const { data: room } = await supabaseAdmin
      .from('chat_rooms')
      .select('match_id, matches(user_a_id, user_b_id)')
      .eq('id', chatRoomId)
      .single();

    if (!room) throw new NotFoundError('Chat room');

    const match = room.matches as any;
    if (match.user_a_id !== userId && match.user_b_id !== userId) {
      throw new AppError('Not your chat', 403);
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('chat_room_id', chatRoomId)
      .neq('moderation_status', 'blocked')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw new AppError(error.message);

    // Mark as read
    await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('chat_room_id', chatRoomId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    return data || [];
  }

  async extendChat(chatRoomId: string) {
    const { data: room } = await supabaseAdmin
      .from('chat_rooms')
      .select('*')
      .eq('id', chatRoomId)
      .single();

    if (!room) throw new NotFoundError('Chat room');

    const newExpiry = chatExtendedExpiresAt(room.expires_at);

    const { data, error } = await supabaseAdmin
      .from('chat_rooms')
      .update({
        expires_at: newExpiry,
        extended_count: room.extended_count + 1,
        status: 'extended',
      })
      .eq('id', chatRoomId)
      .select()
      .single();

    if (error) throw new AppError(error.message);

    // Update match expiry too
    await supabaseAdmin
      .from('matches')
      .update({ chat_expires_at: newExpiry })
      .eq('id', room.match_id);

    await relationshipService.recordEvent(room.match_id, 'chat_extended');

    return data;
  }

  private async moderateMessage(content: string): Promise<'clean' | 'flagged' | 'blocked'> {
    try {
      const message = await claude.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: `Moderate this dating app message. Return ONLY one word: "clean", "flagged", or "blocked".
Block: explicit sexual content, hate speech, threats, personal info sharing (phone/address).
Flag: mildly inappropriate, pushy behavior.
Clean: everything else.

Message: "${content}"`,
          },
        ],
      });

      const result = message.content[0].type === 'text'
        ? message.content[0].text.trim().toLowerCase()
        : 'clean';

      if (result === 'blocked' || result === 'flagged') return result;
      return 'clean';
    } catch {
      logger.error('Moderation failed, defaulting to clean');
      return 'clean';
    }
  }
}

export const chatService = new ChatService();
