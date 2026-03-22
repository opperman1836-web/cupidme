import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || 'nsa-admin-2024';

// ── In-memory fallback (always available, no imports needed) ──
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

// Lazy-load Supabase to prevent cold-start crashes if the package fails to load
async function getSupabase() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return null;
    }

    const { createClient } = await import('@supabase/supabase-js');
    return createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (err) {
    console.error('[leads] Failed to load Supabase client:', err);
    return null;
  }
}

// GET - Fetch all leads (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabase();

    if (!supabase) {
      const sorted = [...inMemoryLeads].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return NextResponse.json({ leads: sorted, total: sorted.length, storage: 'memory' });
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[leads] Supabase GET error:', error.message);
      return NextResponse.json({ leads: [], total: 0, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ leads: data ?? [], total: data?.length ?? 0 });
  } catch (err) {
    console.error('[leads] GET crashed:', err);
    return NextResponse.json({ leads: [], total: 0, error: 'Internal error' }, { status: 200 });
  }
}

// POST - Create new lead (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, location, courseInterest } = body;

    if (!fullName || !phone || !location || !courseInterest) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (fullName.length > 200 || phone.length > 30 || location.length > 200 || courseInterest.length > 200) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 });
    }

    const supabase = await getSupabase();

    if (!supabase) {
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
      console.log(`[leads] Stored in memory (id=${id}). Total: ${inMemoryLeads.length}`);
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
      // Fall back to memory on DB error
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
      return NextResponse.json({ success: true, id, storage: 'memory-fallback' }, { status: 201 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err) {
    console.error('[leads] POST crashed:', err);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

// PATCH - Update lead status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const validStatuses = ['new', 'contacted', 'enrolled', 'lost'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = await getSupabase();

    if (!supabase) {
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
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[leads] PATCH crashed:', err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
