import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload, verify } from 'jsonwebtoken';
import { User } from '../types/resolvers-types';

const JWT_SECRET = process.env.JWT_SECRET || ''; // Use environment variables for secrets

// Hash the password using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // Number of salt rounds for bcrypt
  return await bcrypt.hash(password, saltRounds);
};

// Compare the plain password with the hashed password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate a JWT token for the user
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify the JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

export async function authenticateUser(prisma: PrismaClient, request: Request): Promise<User | null> {
  const header = request.headers.get('authorization');
  if (header !== null) {
    // 1
    const token = header.split(' ')[1];
    // 2
    const tokenPayload = verify(token, JWT_SECRET) as JwtPayload;
    // 3
    const userId = tokenPayload.userId;
    // 4
    return await prisma.user.findUnique({ where: { id: userId } });
  }

  return null;
}
