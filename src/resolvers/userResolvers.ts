// src/resolvers/userResolvers.ts
import { Resolvers, TaskCompletion, User } from '../types/resolvers-types';
import { GraphQLContext } from '../context';
import { comparePassword, generateToken, hashPassword } from '../services/authService';
import { MutationLoginArgs, MutationSignupArgs, User as UserType } from '../types/resolvers-types';

export const userResolvers: Resolvers<GraphQLContext> = {
  Query: {
    me: async (_parent, _args, context): Promise<User> => {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }
      const user = await context.prisma.user.findUnique({
        where: { id: context.currentUser.id }
      });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }
  },
  Mutation: {
    signup: async (_parent, args: MutationSignupArgs, context) => {
      const hashedPassword = await hashPassword(args.password);
      const user = await context.prisma.user.create({
        data: {
          ...args,
          password: hashedPassword
        }
      });
      return user;
    },
    login: async (_parent, args: MutationLoginArgs, context) => {
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
      const token = generateToken(user.id);
      return {
        token,
        user
      };
    }
  },
  User: {
    tasks: async (parent: UserType, _args, context) => {
      const userTasks = await context.prisma.userTask.findMany({
        where: { userId: parent.id },
        include: { task: true }
      });
      return userTasks.map((userTask) => userTask.task);
    },
    completions: async (parent: UserType, _args, context): Promise<TaskCompletion[]> => {
      const completions = await context.prisma.taskCompletion.findMany({
        where: { userId: parent.id }
      });
      return completions as unknown as TaskCompletion[];
    }
  }
};
