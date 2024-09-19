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
    }
  },
  Mutation: {
    createTask: async (_parent: unknown, args: MutationCreateTaskArgs, context: GraphQLContext) => {
      return await context.prisma.task.create({
        data: args
      });
    }
  }
};
