import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'leads.json');

interface Lead {
  id: string;
  fullName: string;
  phone: string;
  location: string;
  courseInterest: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'enrolled' | 'lost';
}

async function getLeads(): Promise<Lead[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveLeads(leads: Lead[]): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(leads, null, 2));
}

// GET - Fetch all leads (admin)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== 'Bearer nsa-admin-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leads = await getLeads();
  return NextResponse.json({ leads, total: leads.length });
}

// POST - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, location, courseInterest } = body;

    if (!fullName || !phone || !location || !courseInterest) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (fullName.length > 200 || phone.length > 30 || location.length > 200 || courseInterest.length > 200) {
      return NextResponse.json(
        { error: 'Input too long' },
        { status: 400 }
      );
    }

    const leads = await getLeads();

    const newLead: Lead = {
      id: crypto.randomUUID(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      courseInterest: courseInterest.trim(),
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    leads.push(newLead);
    await saveLeads(leads);

    return NextResponse.json({ success: true, id: newLead.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// PATCH - Update lead status (admin)
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== 'Bearer nsa-admin-2024') {
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

    const leads = await getLeads();
    const leadIndex = leads.findIndex((l) => l.id === id);
    if (leadIndex === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    leads[leadIndex].status = status;
    await saveLeads(leads);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
