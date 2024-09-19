import { GraphQLContext } from '../context';
import { MutationCreateTaskArgs, QueryAllTasksArgs, QueryTaskArgs, Resolvers } from '../types/resolvers-types';
import { processFilters } from '../helpers/filterHelper';

export const taskResolvers: Resolvers<GraphQLContext> = {
  Query: {
    allTasks: async (_parent: unknown, args: QueryAllTasksArgs, context: GraphQLContext) => {
      const filterConditions = processFilters(args.filters);
      if (!filterConditions) {
        return await context.prisma.task.findMany();
      }

      return await context.prisma.task.findMany({
        where: filterConditions
      });
    },
    task: async (_parent: unknown, args: QueryTaskArgs, context: GraphQLContext) => {
      return await context.prisma.task.findUnique({ where: { id: args.id } });
    },
    myTasks: async (_parent, _args, context) => {
      const userId = context.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const userTasks = await context.prisma.userTask.findMany({
        where: { userId: userId },
        include: { task: true }
      });

      return userTasks.map((userTask) => userTask.task);
    }
  },
  Mutation: {
    createTask: async (_parent: unknown, args: MutationCreateTaskArgs, context: GraphQLContext) => {
      return await context.prisma.task.create({
        data: args
      });
    },
    removeMyTask: async (_parent, args, context) => {
      const userId = context.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const userTaskExists = await context.prisma.userTask.findUnique({
        where: {
          userId_taskId: {
            userId: userId,
            taskId: args.id
          }
        }
      });

      if (!userTaskExists) {
        throw new Error('Task not in your list');
      }

      await context.prisma.userTask.delete({
        where: {
          userId_taskId: {
            userId: userId,
            taskId: args.id
          }
        }
      });

      const task = await context.prisma.task.findUnique({
        where: { id: args.id }
      });

      return task;
    },
    addMyTask: async (_parent, args, context) => {
      const userId = context.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const taskExists = await context.prisma.task.findUnique({
        where: { id: args.id }
      });

      if (!taskExists) {
        throw new Error('Task not found');
      }

      const userTaskExists = await context.prisma.userTask.findUnique({
        where: {
          userId_taskId: {
            userId: userId,
            taskId: args.id
          }
        }
      });

      if (userTaskExists) {
        throw new Error('Task already added to your list');
      }

      await context.prisma.userTask.create({
        data: {
          userId: userId,
          taskId: args.id
        }
      });

      return taskExists;
    }
  }
};
