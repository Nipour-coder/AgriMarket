export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  
  if (!apiKey || !from) {
    console.warn('[Email Warning] RESEND_API_KEY or EMAIL_FROM not configured. Simulated verification URL:', `${appUrl}/verify-email?token=${token}`);
    return;
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

export async function sendPasswordResetEmail(to: string, newPassword: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  const loginUrl = `${appUrl}/login`;

  if (!apiKey || !from) {
    console.log(`===============================================`);
    console.log(` [Password Reset] Temporary password for ${to}: ${newPassword}`);
    console.log(` Sign in at: ${loginUrl}`);
    console.log(`===============================================`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your new AgriMarket password',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
          <h2 style="color: #114227; margin-top: 0;">AgriMarket Password Reset</h2>
          <p style="color: #374151; font-size: 14px;">We received a request to reset your password. A new password has been generated for your account:</p>
          <div style="background-color: #f3f4f6; padding: 14px 20px; border-radius: 12px; font-size: 18px; font-weight: bold; letter-spacing: 1.5px; color: #114227; margin: 20px 0; font-family: monospace; text-align: center;">
            ${newPassword}
          </div>
          <p style="color: #374151; font-size: 14px;">You can now use this password to sign in to your AgriMarket account:</p>
          <p style="margin: 20px 0;">
            <a href="${loginUrl}" style="background-color: #114227; color: white; padding: 12px 24px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 14px;">Sign In to AgriMarket</a>
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
            For security, you can change your password in your security settings after logging in. If you did not request this password reset, please contact support.
          </p>
        </div>
      `,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Email provider rejected password reset email', { status: response.status, body: body.slice(0, 500) });
    throw new Error('The password reset email could not be sent. Please try again later.');
  }
}
