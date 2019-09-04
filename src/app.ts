import Koa from 'koa'
import KoaRouter from 'koa-router'
import cors from '@koa/cors'
import { encode } from 'querystring'
import {
  sendAuthRequest,
  approveAuthRequest,
  checkRequestStatusAndIssueTokens,
} from './services/auth'
import { refreshToken } from './services/jwt'

const app = new Koa()
const router = new KoaRouter()

const DEFAULT_DOMAIN = process.env.TARGET_AUTH_DOMAIN || 'https://znck.dev'
const DEFAULT_CLIENT = 'web'
const DEFAULT_REDIRECT_URL =
  process.env.TARGET_REDIRECT_URL || 'https://znck.dev/auth/complete'

router.post('/authenticate', async context => {
  const { email, client = DEFAULT_CLIENT } = context.query

  const [id, request] = await sendAuthRequest(email, {
    ip: context.ip,
    domain: DEFAULT_DOMAIN,
    client,
  })

  context.body = { id, code: request.code }
})

router.get('/confirm', async context => {
  const { token } = context.query
  let request = await approveAuthRequest(token)

  context.redirect(
    DEFAULT_REDIRECT_URL +
      `?${
        request
          ? encode({ code: request.code, status: request.isApproved })
          : 'status=false'
      }`
  )
})

router.post('/status', async context => {
  const { id } = context.query

  const result = await checkRequestStatusAndIssueTokens(id)

  if (typeof result === 'boolean') {
    if (result) {
      return context.throw(418)
    }

    return context.throw(404)
  }

  context.body = result
})

router.post('/refresh', async context => {
  const token = context.get('X-Refresh-Token')

  context.body = await refreshToken(token, () => true)
})

router.get('*', async context => {
  context.redirect('https://awesomeconf.design')
})

app.proxy = true
app
  .use(
    cors({
      allowMethods: ['POST'],
      allowHeaders: ['X-Refresh-Token'],
      origin: DEFAULT_DOMAIN,
    })
  )
  .use(router.allowedMethods())
  .use(router.routes())

app.listen(80)
