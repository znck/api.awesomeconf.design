import { lookup } from 'geoip-lite'
import uuid from 'uuid'
import Cache from 'quick-lru'
import { issueToken, TokenPair } from './jwt'
import { sendAuthToken } from './mail'
import { sign, verify } from './sign'

export interface AuthRequest {
  ip: string
  email: string
  code: string
  domain: string
  client: string
  createdAt: number
  isApproved: boolean
}

const cache = new Cache<string, AuthRequest>({
  maxSize: 10000,
})

export type AuthRequestID = string

export async function sendAuthRequest(
  email: string,
  { client, domain, ip }: { ip: string; client: string; domain: string }
): Promise<[AuthRequestID, AuthRequest]> {
  const id: AuthRequestID = uuid()
  const code = 'some random words'
  const request: AuthRequest = {
    ip,
    email,
    code,
    client,
    domain,
    createdAt: Date.now(),
    isApproved: false,
  }

  cache.set(id, request)

  sendAuthToken(await sign(id), request, lookup(ip))

  return [id, request]
}

export async function approveAuthRequest(token: AuthRequestID) {
  const requestID = await verify(token)
  const request = cache.get(requestID)

  if (request) {
    cache.set(requestID, {
      ...request,
      isApproved: true,
    })
  }

  return cache.peek(requestID)
}

const THIRTY_MINUTES = 30 * 60 * 1000
export function checkRequestStatusAndIssueTokens(
  requestID: AuthRequestID
): boolean | Promise<TokenPair> {
  const request = cache.peek(requestID)

  if (request) {
    if (request.isApproved) {
      cache.delete(requestID)

      return issueToken(requestID, {
        domain: request.domain,
        client: request.client,
        user: request.email,
      })
    } else if (request.createdAt + THIRTY_MINUTES < Date.now()) {
      cache.delete(requestID)
    } else {
      return true
    }
  }

  return false
}
