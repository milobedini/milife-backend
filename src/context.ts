import { PrismaClient } from '@prisma/client';
import { authenticateUser, verifyToken } from './services/authService';
import { YogaInitialContext } from 'graphql-yoga';
import { User } from './types/resolvers-types';

const prisma = new PrismaClient();

export type GraphQLContext = {
  prisma: PrismaClient;
  currentUser?: null | User;
};

export async function createContext(initialContext: YogaInitialContext): Promise<GraphQLContext> {
  return { prisma, currentUser: await authenticateUser(prisma, initialContext.request) }; // Return req as part of the context
}
