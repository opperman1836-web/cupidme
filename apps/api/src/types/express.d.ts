import { UserRole } from './index';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      accessToken?: string;
    }
  }
}

export {};
