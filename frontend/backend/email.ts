import 'server-only';

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) {
    throw new Error('Email is not configured. Set RESEND_API_KEY, EMAIL_FROM and APP_URL before registering accounts.');
  }

  const verifyUrl = new URL('/verify-email', appUrl);
  verifyUrl.searchParams.set('token', token);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Verify your AgriMarket email',
      html: `<p>Welcome to AgriMarket.</p><p><a href="${verifyUrl.toString()}">Verify your email address</a></p><p>This link expires in 24 hours. If you did not create an account, you can ignore this message.</p>`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error('Email provider rejected verification email', { status: response.status, body: body.slice(0, 500) });
    throw new Error('The verification email could not be sent. Please try again later.');
  }
}
