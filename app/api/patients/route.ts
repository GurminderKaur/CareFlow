import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth/session';
import { createPatient, searchPatientsByName, validateNewPatientInput } from '@/lib/db/patients';
import { errorResponse, unexpectedErrorResponse, validationErrorResponse } from '@/lib/api/errors';
import type { PatientListResponse, PatientResponse } from '@/types/patient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() ?? '';

  try {
    const patients = await searchPatientsByName(query);
    return NextResponse.json<PatientListResponse>({ patients });
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to load patients');
  }
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = validateNewPatientInput(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const patient = await createPatient(parsed.data, user.id);
    return NextResponse.json<PatientResponse>({ patient }, { status: 201 });
  } catch (error) {
    return unexpectedErrorResponse(error, 'Unable to create patient');
  }
}
