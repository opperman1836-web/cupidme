import { AuthRequest } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';

export async function startChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const room = await chatService.startChat(req.body.match_id, req.userId!);
    res.status(201).json({ success: true, data: room });
  } catch (err) { next(err); }
}

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const message = await chatService.sendMessage(
      req.params.roomId,
      req.userId!,
      req.body.content,
      req.body.message_type
    );
    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
}

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await chatService.getMessages(req.params.roomId, req.userId!, page, limit);
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
}

export async function extendChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const room = await chatService.extendChat(req.params.roomId);
    res.json({ success: true, data: room });
  } catch (err) { next(err); }
}
