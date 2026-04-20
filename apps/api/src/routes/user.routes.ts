import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { rateLimit } from '../middleware/rateLimit.middleware';
import {
  createProfileSchema, updateProfileSchema,
  addPhotoSchema, replacePhotosSchema, setInterestsSchema,
} from '../validators/user.validator';
import {
  getProfile, createProfile, updateProfile,
  addPhoto, replacePhotos, deletePhoto, setInterests,
  discover, submitVerification,
} from '../controllers/user.controller';

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get('/me', getProfile);
userRoutes.get('/profile/:userId', getProfile);
userRoutes.post('/profile', validate(createProfileSchema), createProfile);
userRoutes.patch('/profile', validate(updateProfileSchema), updateProfile);
userRoutes.put('/photos', validate(replacePhotosSchema), replacePhotos); // Canonical: replace-all
userRoutes.post('/photos', validate(addPhotoSchema), addPhoto);       // Legacy: single
userRoutes.delete('/photos/:photoId', deletePhoto);
userRoutes.put('/interests', validate(setInterestsSchema), setInterests);
userRoutes.get('/discover', rateLimit(20, 60000), discover);
userRoutes.post('/verify', submitVerification);
