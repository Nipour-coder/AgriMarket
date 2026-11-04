import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HttpError } from '@backend/auth';

export function apiError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: 'Please check the submitted information.',
      issues: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    }, { status: 400 });
  }
  console.error('API request failed', error);
  return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.', 'INVALID_JSON');
  }
}
