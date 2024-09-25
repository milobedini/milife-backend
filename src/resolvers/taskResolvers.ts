// src/resolvers/taskResolvers.ts
import { Resolvers } from '../types/resolvers-types';
import { GraphQLContext } from '../context';
import {
  MutationCreateTaskArgs,
  QueryAllTasksArgs,
  QueryTaskArgs,
  TaskCompletion as TaskCompletionType
} from '../types/resolvers-types';
import { processFilters } from '../helpers/filterHelper';
import { MessageReturn } from '../types/customTypes';

export const taskResolvers: Resolvers<GraphQLContext> = {
  Query: {
    allTasks: async (_parent, args: QueryAllTasksArgs, context) => {
      const filterConditions = processFilters(args.filters);
      return await context.prisma.task.findMany({
        where: filterConditions || undefined
      });
    },
    task: async (_parent, args: QueryTaskArgs, context) => {
      return await context.prisma.task.findUnique({ where: { id: args.id } });
    }
  },
  Mutation: {
    createTask: async (_parent, args: MutationCreateTaskArgs, context) => {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }

      const user = await context.prisma.user.findUnique({
        where: { id: context.currentUser.id }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return await context.prisma.task.create({
        data: args
      });
    }
  }
};
