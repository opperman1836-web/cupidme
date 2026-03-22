import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { startChat, sendMessage, getMessages, extendChat } from '../controllers/chat.controller';

export const chatRoutes = Router();

chatRoutes.use(requireAuth);

chatRoutes.post('/start', startChat);
chatRoutes.post('/:roomId/messages', sendMessage);
chatRoutes.get('/:roomId/messages', getMessages);
chatRoutes.post('/:roomId/extend', extendChat);
