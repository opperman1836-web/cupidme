import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export async function register(req: any, res: any, next: any) {
  try {
    const { email, password, phone } = req.body;
    const result = await authService.register(email, password, phone);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function login(req: any, res: any, next: any) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function refresh(req: any, res: any, next: any) {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refreshToken(refresh_token);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function logout(req: AuthRequest, res: any, next: any) {
  try {
    await authService.logout(req.userId!);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
}
