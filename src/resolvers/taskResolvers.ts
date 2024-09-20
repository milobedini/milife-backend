// src/resolvers/taskResolvers.ts
import { MutationRemoveMyTaskArgs, Resolvers, TaskCompletion, User } from '../types/resolvers-types';
import { GraphQLContext } from '../context';
import {
  MutationCompleteTaskArgs,
  MutationCreateTaskArgs,
  MutationUncompleteTaskArgs,
  QueryAllTasksArgs,
  QueryMyTaskCompletionsArgs,
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
    },
    myTasks: async (_parent, _args, context) => {
      const userId = context.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const userTasks = await context.prisma.userTask.findMany({
        where: { userId },
        include: { task: true }
      });
      return userTasks.map((userTask) => userTask.task);
    },
    myTaskCompletions: async (_parent, args: QueryMyTaskCompletionsArgs, context): Promise<TaskCompletionType[]> => {
      const userId = context.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const { taskId, startDate, endDate } = args;
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
      }

      const completions = await context.prisma.taskCompletion.findMany({
        where: {
          userId,
          taskId,
          date: {
            gte: start,
            lte: end
          },
          completed: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      return completions as unknown as TaskCompletionType[];
    }
  },
  Mutation: {
    createTask: async (_parent, args: MutationCreateTaskArgs, context) => {
      return await context.prisma.task.create({
        data: args
      });
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
            userId,
            taskId: args.id
          }
        }
      });
      if (userTaskExists) {
        throw new Error('Task already added to your list');
      }
      await context.prisma.userTask.create({
        data: {
          userId,
          taskId: args.id
        }
      });
      return taskExists;
    },
    removeMyTask: async (_parent, args, context) => {
      const userId = context.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const userTaskExists = await context.prisma.userTask.findUnique({
        where: {
          userId_taskId: {
            userId,
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
            userId,
            taskId: args.id
          }
        }
      });
      const task = await context.prisma.task.findUnique({
        where: { id: args.id }
      });
      return task;
    },
    completeTask: async (_parent, args: MutationCompleteTaskArgs, context): Promise<TaskCompletionType> => {
      const userId = context.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const { taskId, date } = args;
      const completionDate = new Date(date);
      if (isNaN(completionDate.getTime())) {
        throw new Error('Invalid date format');
      }
      const taskExists = await context.prisma.task.findUnique({
        where: { id: taskId }
      });
      if (!taskExists) {
        throw new Error('Task not found');
      }
      const userTaskExists = await context.prisma.userTask.findUnique({
        where: {
          userId_taskId: {
            userId,
            taskId
          }
        }
      });
      if (!userTaskExists) {
        throw new Error('Task not added to your list');
      }
      const completion = await context.prisma.taskCompletion.upsert({
        where: {
          userId_taskId_date: {
            userId,
            taskId,
            date: completionDate
          }
        },
        update: { completed: true },
        create: {
          userId,
          taskId,
          date: completionDate,
          completed: true
        }
      });
      return completion as unknown as TaskCompletionType;
    },
    uncompleteTask: async (_parent, args: MutationUncompleteTaskArgs, context): Promise<MessageReturn> => {
      const userId = context.currentUser?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const { taskId, date } = args;
      const completionDate = new Date(date);
      if (isNaN(completionDate.getTime())) {
        throw new Error('Invalid date format');
      }
      const completion = await context.prisma.taskCompletion.findUnique({
        where: {
          userId_taskId_date: {
            userId,
            taskId,
            date: completionDate
          }
        }
      });
      if (!completion) {
        throw new Error('Completion record not found');
      }
      await context.prisma.taskCompletion.delete({
        where: { id: completion.id }
      });
      return { message: 'Task uncompleted' };
    }
  },
  Task: {
    users: async (parent, _args, context): Promise<User[]> => {
      const userTasks = await context.prisma.userTask.findMany({
        where: { taskId: parent.id },
        include: { user: true }
      });
      return userTasks.map((userTask) => userTask.user);
    },
    completions: async (parent, _args, context): Promise<TaskCompletionType[]> => {
      const completions = await context.prisma.taskCompletion.findMany({
        where: { taskId: parent.id }
      });
      return completions as unknown as TaskCompletionType[];
    }
  }
};
