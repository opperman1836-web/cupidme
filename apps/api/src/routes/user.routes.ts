import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProfileSchema, addPhotoSchema, setInterestsSchema } from '../validators/user.validator';
import {
  getProfile, createProfile, updateProfile,
  addPhoto, deletePhoto, setInterests,
  discover, submitVerification,
} from '../controllers/user.controller';

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get('/me', getProfile);
userRoutes.get('/profile/:userId', getProfile);
userRoutes.post('/profile', validate(createProfileSchema), createProfile);
userRoutes.patch('/profile', updateProfile);
userRoutes.post('/photos', validate(addPhotoSchema), addPhoto);
userRoutes.delete('/photos/:photoId', deletePhoto);
userRoutes.put('/interests', validate(setInterestsSchema), setInterests);
userRoutes.get('/discover', discover);
userRoutes.post('/verify', submitVerification);
