import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/session';
import { createPatient, searchPatientsByName, validateNewPatientInput } from '@/lib/db/patients';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() ?? '';
  const patients = await searchPatientsByName(query);

  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = validateNewPatientInput(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const patient = await createPatient(parsed.data, user.id);
    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create patient';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
