import Mailgun, { Attachment } from 'mailgun-js'
import { AuthRequest } from './auth'
// @ts-ignore
import logo from '../assets/logo.png'

const CONFIRMATION_URL =
  process.env.AUTH_CONFIRM_URL || 'https://auth.awesomeconf.design/confirm'
const transport = new Mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
})
const AUTH_MAILER = process.env.AUTH_MAIL_ADDRESS || 'security@awesomeconf.design'

export function sendAuthToken(
  token: string,
  request: AuthRequest,
  source: { city: string; country: string } | null
) {
  const URL = `${CONFIRMATION_URL}?token=${token}`
  const HTML = `<div style="background: #fafafa; width: 100%; padding: 24px 0;">
  <div align="center" style="text-align: center;">
   <img width="240" src="cid:logo.png" />
  </div>
  
  <div
    style="width: 600px; padding: 24px; margin: 24px auto; background: white; box-shadow: -4px 4px 8px rgba(0, 0, 0, 0.25)">
    
    <p>Hello,</p>

    <p>We have received a login attempt from ${
      source && source.city
        ? `${source.city}, ${source.country} (${request.ip})`
        : request.ip
    } with the following code:
    </p>

    <br>
    <table width="100%">
      <tr>
        <td align="center">
          <div style="font-size: 24px; display: block; margin: 24px auto; text-align: center" align="center">${
            request.code
          }</div>
        </td>
      </tr>
    </table>
    <br>

    <p>To complete the login process, please click the button below:</p>

    <br>
    <table width="100%">
      <tr>
        <td align="center">
          <br>
          <a style="padding: 8px 24px; margin: 24px; background: #333; color: white; text-decoration: none" href="${URL}">APPROVE</a>
          <br>
        </td>
      </tr>
    </table>
    <br>

    <p>Or copy and paste this URL into your browser:</p>

    <p>
      <pre>${URL}</pre>
    </p>
  </div>


  <footer style="color: rgba(0, 0, 0, 0.53); margin: 24px auto; width: 600px; padding: 0 24px 24px">
    If you didn't attempt to log in but received this email, or if the location
    doesn't match, please ignore this email. If you are concerned about your
    account's safety, please reply to this email to get in touch with us.
  </footer>
</div>`

  transport.messages().send({
    to: request.email,
    from: AUTH_MAILER,
    subject: `Login Verification (code: "${request.code}")`,
    html: HTML,
    inline: new transport.Attachment({
      data: logo,
      contentType: 'image/png',
      filename: 'logo.png',
    }),
  })
}
