import { createHmac, timingSafeEqual } from 'crypto';

const SECRET: string = process.env.SIGNING_SECRET;

export async function sign(message: string, secret: string = SECRET): Promise<string> {
  return Buffer.from(
    message +
      '.' +
      createHmac('sha256', secret)
        .update(message)
        .digest('base64')
        .replace(/\=+$/, '')
  ).toString('base64');
}

export async function verify(text: string, secret: string = SECRET): Promise<string | null> {
  const originalText = Buffer.from(text, 'base64').toString();
  const message = originalText.slice(0, originalText.lastIndexOf('.'));
  
  const mac$ = Buffer.from(await sign(message, secret));
  const message$ = Buffer.alloc(mac$.length);

  message$.write(text);

  return timingSafeEqual(mac$, message$) ? message : null;
}
