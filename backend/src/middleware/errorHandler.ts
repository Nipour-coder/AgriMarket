import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Please check the submitted information.',
      issues: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
    return;
  }

  console.error('Unhandled request error:', err);

  // Check for Postgres / Drizzle unique constraint violations
  const isDuplicate = (err as any)?.code === '23505' || 
    (err as any)?.cause?.code === '23505' || 
    (err instanceof Error && err.message.includes('unique constraint'));

  if (isDuplicate) {
    res.status(409).json({ error: 'An account with this email address or record already exists. Please sign in.' });
    return;
  }

  // Sanitize internal database queries from user-facing output
  let message = 'An unexpected server error occurred. Please try again.';
  if (err instanceof Error) {
    if (err.name === 'DrizzleQueryError' || err.message.startsWith('Failed query:')) {
      message = 'A database error occurred while processing your request. Please try again.';
    } else {
      message = err.message;
    }
  }

  res.status(500).json({ error: message });
}
