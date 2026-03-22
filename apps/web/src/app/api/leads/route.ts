import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || 'nsa-admin-2024';

// GET - Fetch all leads (admin only)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabase();
    const { data, error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ leads: data, total: count });
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// POST - Create new lead (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, location, courseInterest } = body;

    // Validation
    if (!fullName || !phone || !location || !courseInterest) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (fullName.length > 200 || phone.length > 30 || location.length > 200 || courseInterest.length > 200) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 });
    }

    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('leads')
      .insert({
        full_name: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        course_interest: courseInterest.trim(),
        status: 'new',
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error('Failed to create lead:', err);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

// PATCH - Update lead status (admin only)
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const validStatuses = ['new', 'contacted', 'enrolled', 'lost'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createAdminSupabase();
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update lead:', err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
