import jwt from 'jsonwebtoken'
import P from '@znck/promised'

const DAY = 24 * 60 * 60 * 1000
const SEVEN_DAYS = 7 * DAY
const THIRTY_DAYS = 30 * DAY

const JWT = P(jwt)
const JWT_SECRET = process.env.JWT_SECRET

const CLAIMS_NAMESPACE = process.env.JWT_CLAIMS_NAMESPACE || 'https://awesomeconf.design/jwt/claims'

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

const algorithm = 'HS256'
const issuer = process.env.JWT_ISSUER || 'https://api.awesomeconf.design'

export async function verify(
  token: string,
  secret: string = JWT_SECRET
): Promise<any> {
  if (!secret)
    throw new Error(`A secret key is required for signing the JWT token`)

  return JWT.verify(token, secret, { issuer })
}

export async function refreshToken(
  token: string,
  isSessionValid: (id: string) => Promise<boolean> | boolean,
  secret: string = JWT_SECRET
): Promise<TokenPair | null> {
  const { sub: subject, jti: token_id } = await verify(token, secret)

  if (await isSessionValid(token_id)) {
    const { [CLAIMS_NAMESPACE]: claims } = await JWT.decode(subject, secret)

    return issueToken(token_id, claims, secret)
  }

  return null
}

export async function issueToken(
  token_id: string,
  claims: any = null,
  secret: string = JWT_SECRET,
  expiry: number = SEVEN_DAYS
): Promise<TokenPair> {
  const issuedAt = Date.now()
  const accessTokenExpiry = issuedAt + expiry
  const payload = claims && Object.keys(claims).length ? { [CLAIMS_NAMESPACE]: claims } : {}

  const accessToken = await JWT.sign(
    payload,
    secret,
    {
      algorithm,
      expiresIn: (accessTokenExpiry - issuedAt) / 1000,
      issuer,
      jwtid: token_id
    }
  )

  const refreshToken = await JWT.sign({}, secret, {
    algorithm,
    expiresIn: (accessTokenExpiry + SEVEN_DAYS - issuedAt) / 1000,
    subject: accessToken,
    jwtid: token_id,
    issuer,
  })

  return {
    accessToken,
    refreshToken,
  }
}
