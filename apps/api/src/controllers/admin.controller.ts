import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const { data, error, count } = await supabaseAdmin
      .from('users')
      .select('*, profiles(display_name, city)', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message);
    res.json({ success: true, data, total: count, page, limit });
  } catch (err) { next(err); }
}

export async function toggleUserActive(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    await supabaseAdmin
      .from('users')
      .update({ is_active })
      .eq('id', userId);

    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: req.userId!,
      action: is_active ? 'activate_user' : 'deactivate_user',
      target_type: 'user',
      target_id: userId,
    });

    res.json({ success: true, message: `User ${is_active ? 'activated' : 'deactivated'}` });
  } catch (err) { next(err); }
}

export async function getReports(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string || 'open';

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function resolveReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reportId } = req.params;
    const { status, resolution_note } = req.body;

    await supabaseAdmin
      .from('reports')
      .update({
        status,
        resolution_note,
        resolved_by: req.userId!,
      })
      .eq('id', reportId);

    res.json({ success: true, message: 'Report updated' });
  } catch (err) { next(err); }
}

export async function getPendingVenues(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .select('*, users(email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function approveVenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { venueId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    await supabaseAdmin
      .from('venues')
      .update({
        status,
        approved_by: req.userId!,
        approved_at: new Date().toISOString(),
      })
      .eq('id', venueId);

    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: req.userId!,
      action: `venue_${status}`,
      target_type: 'venue',
      target_id: venueId,
    });

    res.json({ success: true, message: `Venue ${status}` });
  } catch (err) { next(err); }
}

export async function approveVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { verificationId } = req.params;
    const { status } = req.body;

    const { data } = await supabaseAdmin
      .from('user_verifications')
      .update({
        status,
        reviewed_by: req.userId!,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', verificationId)
      .select('user_id')
      .single();

    if (data && status === 'approved') {
      await supabaseAdmin
        .from('users')
        .update({ is_verified: true })
        .eq('id', data.user_id);
    }

    res.json({ success: true, message: `Verification ${status}` });
  } catch (err) { next(err); }
}

export async function getPaymentsOverview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { data: recentPayments } = await supabaseAdmin
      .from('payments')
      .select('*, users(email), products(name)')
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(100);

    const { count: totalPayments } = await supabaseAdmin
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'succeeded');

    const { count: activeSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    res.json({
      success: true,
      data: {
        recent_payments: recentPayments,
        total_payments: totalPayments,
        active_subscriptions: activeSubscriptions,
      },
    });
  } catch (err) { next(err); }
}
