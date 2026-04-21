import jwt from 'jsonwebtoken'

const JWT_SECRET    = process.env.JWT_SECRET    || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

export interface JWTPayload {
  userId:   number   // users.user_id  (integer in new schema)
  username: string   // users.username
  resort:   string   // users.resort   (replaces hotel_id)
  role:     string   // roles.role_name
  fullName?: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}
