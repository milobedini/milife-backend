// src/resolvers/userResolvers.ts
import { Resolvers, User } from '../types/resolvers-types';
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
        where: { id: context.currentUser.id },
        include: {
          userTasks: {
            include: {
              task: true
            }
          }
        }
      });
      if (!user) {
        throw new Error('User not found');
      }
      return user as unknown as User;
    },
    userTasks: async (_parent, _args, context) => {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }
      const userTasks = await context.prisma.userTask.findMany({
        where: { userId: context.currentUser.id },
        include: {
          task: true
        }
      });

      return userTasks;
    },
    userCompletions: async (_parent, args, context) => {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }

      // Scenario: specific task, no date range
      if (args.taskId && !(args.startDate && args.endDate)) {
        const taskCompletions = await context.prisma.taskCompletion.findMany({
          where: {
            userTask: { userId: context.currentUser.id, taskId: args.taskId }
          },
          include: { userTask: { include: { task: true } } }
        });
        return taskCompletions.map((completion) => ({
          ...completion,
          date: completion.date.toISOString()
        }));
      }
      // Scenario: specific task, date range
      if (args.taskId && args.startDate && args.endDate) {
        const taskCompletions = await context.prisma.taskCompletion.findMany({
          where: {
            userTask: { userId: context.currentUser.id, taskId: args.taskId },
            date: {
              gte: new Date(args.startDate),
              lte: new Date(args.endDate)
            }
          },
          include: { userTask: { include: { task: true } } }
        });
        return taskCompletions.map((completion) => ({
          ...completion,
          date: completion.date.toISOString()
        }));
      }
      // Scenario: no task, no date range
      const taskCompletions = await context.prisma.taskCompletion.findMany({
        where: { userTask: { userId: context.currentUser.id } },
        include: { userTask: { include: { task: true } } }
      });
      return taskCompletions.map((completion) => ({
        ...completion,
        date: completion.date.toISOString()
      }));
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
    },
    removeMyTask: async (_parent, args, context) => {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }
      const userTask = await context.prisma.userTask.findFirst({
        where: { userId: context.currentUser.id, taskId: args.id }
      });
      if (!userTask) {
        throw new Error('Task not found or not assigned to user');
      }

      // Delete associated TaskCompletion records first
      await context.prisma.taskCompletion.deleteMany({
        where: {
          userTaskId: userTask.id
        }
      });

      await context.prisma.userTask.delete({
        where: { id: userTask.id }
      });
      return {
        message: 'Task removed'
      };
    },
    addMyTask: async (_parent, args, context) => {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }
      const userTask = await context.prisma.userTask.create({
        data: {
          task: { connect: { id: args.id } },
          user: { connect: { id: context.currentUser.id } }
        },
        include: { task: true }
      });
      return userTask;
    },
    completeTask: async (_parent, args, context) => {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }
      const userTask = await context.prisma.userTask.findUnique({
        where: { id: args.userTaskId }
      });
      if (!userTask || userTask.userId !== context.currentUser.id) {
        throw new Error('UserTask not found or not authorized');
      }

      const completionDate = new Date(args.date);
      if (isNaN(completionDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Check if the task is already completed on the given date
      const existingCompletion = await context.prisma.taskCompletion.findUnique({
        where: {
          userTaskId_date: {
            userTaskId: userTask.id,
            date: completionDate
          }
        }
      });

      if (existingCompletion) {
        throw new Error('Task already completed on this date');
      }

      const taskCompletion = await context.prisma.taskCompletion.create({
        data: {
          userTask: { connect: { id: userTask.id } },
          date: completionDate,
          completed: true
        },
        include: { userTask: { include: { task: true } } }
      });
      return { ...taskCompletion, date: taskCompletion.date.toISOString() };
    },
    uncompleteTask: async (_parent, args, context) => {
      if (!context.currentUser) {
        throw new Error('Not authenticated');
      }
      const userTask = await context.prisma.userTask.findUnique({
        where: { id: args.userTaskId }
      });
      if (!userTask || userTask.userId !== context.currentUser.id) {
        throw new Error('UserTask not found or not authorized');
      }

      const completionDate = new Date(args.date);
      if (isNaN(completionDate.getTime())) {
        throw new Error('Invalid date format');
      }

      const taskCompletion = await context.prisma.taskCompletion.findUnique({
        where: {
          userTaskId_date: {
            userTaskId: userTask.id,
            date: completionDate
          }
        }
      });

      if (!taskCompletion) {
        throw new Error('Task not completed on this date');
      }

      await context.prisma.taskCompletion.delete({
        where: { id: taskCompletion.id }
      });

      return { message: 'Task uncompleted' };
    }
  },
  // Field resolvers
  User: {
    userTasks: async (parent, _args, context) => {
      return await context.prisma.userTask.findMany({
        where: { userId: parent.id },
        include: { task: true }
      });
    },
    completions: async (parent, _args, context) => {
      const taskCompletions = await context.prisma.taskCompletion.findMany({
        where: { userTask: { userId: parent.id } },
        include: { userTask: { include: { task: true } } }
      });
      return taskCompletions.map((completion) => ({
        ...completion,
        date: completion.date.toISOString()
      }));
    }
  }
};
