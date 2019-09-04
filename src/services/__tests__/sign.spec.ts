const SIGNING_SECRET = 'my-secret-key';

import { sign, verify } from '../sign';

describe('signing', () => {
  test('sign and verify', async () => {
    const message = 'Foo Bar Baz';
    const token = await sign(message, SIGNING_SECRET);
    expect(await verify(token, SIGNING_SECRET)).toBe(message);
  });

  test('invalid signature', async () => {
    const message = 'Foo Bar Baz';

    const text = Buffer.from(message + '.' + 'invalid signature').toString('base64')

    await expect(verify(text, SIGNING_SECRET)).resolves.toBe(null)
  })
});
