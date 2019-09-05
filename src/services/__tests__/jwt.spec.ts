const SECRET = 'my-secret-key';

import { issueToken, verify, refreshToken } from '../jwt';

describe('jwt', () => {

  test('issue and verify', async () => {
    const { accessToken, refreshToken } = await issueToken('1', { test: 'yep' }, SECRET);

    expect(await verify(accessToken, SECRET)).toMatchObject({
      jti: '1',
      'https://awesomeconf.design/jwt/claims': {
        test: 'yep'
      }
    });

    expect(await verify(refreshToken, SECRET)).toMatchObject({
      sub: accessToken
    })
  });

  test('expired token and refresh', async () => {
    const { accessToken, refreshToken: token } = await issueToken('1', { test: 'yep' }, SECRET, 1000);

    await delay(1500)

    await expect(verify(accessToken, SECRET)).rejects.toThrowError(/jwt expired/)

    const { accessToken: newToken } = await refreshToken(token, id => id === '1', SECRET)

    expect(await verify(newToken, SECRET)).toMatchObject({
      jti: '1',
      'https://awesomeconf.design/jwt/claims': {
        test: 'yep'
      }
    });
  })
});

function delay(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}
