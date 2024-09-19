import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || '' // Use environment variables for secrets

// Hash the password using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10 // Number of salt rounds for bcrypt
  return await bcrypt.hash(password, saltRounds)
}

// Compare the plain password with the hashed password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

// Generate a JWT token for the user
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' }) // Token valid for 1 hour
}

// Verify the JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET)
}
