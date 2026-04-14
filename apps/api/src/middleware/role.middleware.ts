import { AuthRequest } from './auth.middleware';
import { AppError } from '../utils/errors';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: any, next: any) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}
