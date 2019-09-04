
jest.mock('../mail')

import { sendAuthToken } from '../mail'
import { sendAuthRequest } from '../auth'


describe('sendAuthRequest', () => {
  test('should send auth email', async () => {
    const [id, request] = await sendAuthRequest('jane@example.com', {
      ip: '103.86.1.255',
      domain: 'example.com',
      client: 'web',
    })

    expect(sendAuthToken).toHaveBeenCalledWith(
      request,
      expect.objectContaining({ city: 'Bengaluru', country: 'IN' })
    )
  })
})
