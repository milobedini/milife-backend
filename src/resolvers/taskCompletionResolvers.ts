// src/resolvers/taskCompletionResolvers.ts
import { Resolvers, Task, User } from '../types/resolvers-types';

export const taskCompletionResolvers: Resolvers = {
  TaskCompletion: {
    user: async (parent, _args, context): Promise<User> => {
      return await context.prisma.user.findUnique({
        where: { id: parent.userId }
      });
    },
    task: async (parent, _args, context): Promise<Task> => {
      return await context.prisma.task.findUnique({
        where: { id: parent.taskId }
      });
    }
  }
};
