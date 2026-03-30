import { SignJWT, jwtVerify, JWTPayload } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const EXPIRES_IN = '7d'

export interface TokenPayload extends JWTPayload {
  userId: string
  email: string
  isAdmin: boolean // deprecated — use role
  role: string
  canCreateClass: boolean
  canViewStudents: boolean
  canValidateAttendance: boolean
  canBulkUpload: boolean
}

export async function signToken(payload: {
  userId: string
  email: string
  isAdmin: boolean
  role: string
  canCreateClass: boolean
  canViewStudents: boolean
  canValidateAttendance: boolean
  canBulkUpload: boolean
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as TokenPayload
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
