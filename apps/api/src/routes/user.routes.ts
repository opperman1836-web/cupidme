import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getProfile, createProfile, updateProfile,
  addPhoto, deletePhoto, setInterests,
  discover, submitVerification,
} from '../controllers/user.controller';

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get('/me', getProfile);
userRoutes.get('/profile/:userId', getProfile);
userRoutes.post('/profile', createProfile);
userRoutes.patch('/profile', updateProfile);
userRoutes.post('/photos', addPhoto);
userRoutes.delete('/photos/:photoId', deletePhoto);
userRoutes.put('/interests', setInterests);
userRoutes.get('/discover', discover);
userRoutes.post('/verify', submitVerification);
