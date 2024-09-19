import { GraphQLContext } from '../context';
import { comparePassword, generateToken, hashPassword } from '../services/authService';
import { MutationLoginArgs, MutationSignupArgs } from '../types/resolvers-types';

export const userResolvers = {
  Query: {
    // Get the current user
    me(_parent: unknown, _args: unknown, context: GraphQLContext) {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }
      return context.currentUser;
    }
  },

  Mutation: {
    // User signup (register)
    signup: async (_parent: unknown, args: MutationSignupArgs, context: GraphQLContext) => {
      const hashedPassword = await hashPassword(args.password);

      const user = await context.prisma.user.create({
        data: {
          ...args,
          password: hashedPassword
        }
      });

      return user;
    },

    // User login
    login: async (_parent: unknown, args: MutationLoginArgs, context: GraphQLContext) => {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isPasswordValid = await comparePassword(args.password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Generate a JWT token after successful login
      const token = generateToken(user.id);

      return {
        token,
        user
      };
    }
  }
};
