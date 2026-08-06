import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import type { ApiErrorResponse } from '@/types/api';

export function errorResponse(message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>({ error: message }, { status });
}

export function validationErrorResponse(error: ZodError) {
  return errorResponse(error.issues[0]?.message ?? 'Invalid input', 400);
}

export function unexpectedErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  return errorResponse(message, 500);
}
