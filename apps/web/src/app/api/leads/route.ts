import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || 'nsa-admin-2024';

// ── In-memory fallback when Supabase is not configured ──
interface InMemoryLead {
  id: string;
  full_name: string;
  phone: string;
  location: string;
  course_interest: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const inMemoryLeads: InMemoryLead[] = [];
let nextId = 1;

function generateId(): string {
  return `mem-${Date.now()}-${nextId++}`;
}

// GET - Fetch all leads (admin only)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabase();

    if (!supabase) {
      // In-memory fallback
      const sorted = [...inMemoryLeads].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return NextResponse.json({ leads: sorted, total: sorted.length, storage: 'memory' });
    }

    const { data, error, count } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[leads] Supabase GET error:', error.message);
      throw error;
    }

    return NextResponse.json({ leads: data, total: count });
  } catch (err) {
    console.error('[leads] Failed to fetch leads:', err);
    return NextResponse.json(
      { error: 'Failed to fetch leads', leads: [], total: 0 },
      { status: 500 }
    );
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

    if (!supabase) {
      // In-memory fallback
      const id = generateId();
      const now = new Date().toISOString();
      inMemoryLeads.push({
        id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        course_interest: courseInterest.trim(),
        status: 'new',
        created_at: now,
        updated_at: now,
      });
      console.log(`[leads] Stored lead in memory (id=${id}). Total: ${inMemoryLeads.length}`);
      return NextResponse.json({ success: true, id, storage: 'memory' }, { status: 201 });
    }

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

    if (error) {
      console.error('[leads] Supabase INSERT error:', error.message);
      throw error;
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error('[leads] Failed to create lead:', err);
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

    if (!supabase) {
      // In-memory fallback
      const lead = inMemoryLeads.find((l) => l.id === id);
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      lead.status = status;
      lead.updated_at = new Date().toISOString();
      return NextResponse.json({ success: true, storage: 'memory' });
    }

    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('[leads] Supabase PATCH error:', error.message);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[leads] Failed to update lead:', err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
