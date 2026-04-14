import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import { startChat, sendMessage, getMessages, extendChat } from '../controllers/chat.controller';

export const chatRoutes = Router();

chatRoutes.use(requireAuth);

chatRoutes.post('/start', rateLimit(10, 60000), startChat);
chatRoutes.post('/:roomId/messages', rateLimit(15, 60000), sendMessage);
chatRoutes.get('/:roomId/messages', getMessages);
chatRoutes.post('/:roomId/extend', rateLimit(3, 60000), extendChat);
