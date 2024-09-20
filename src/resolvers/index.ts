// src/resolvers/index.ts
import { Resolvers } from '../types/resolvers-types';
import { GraphQLContext } from '../context';
import { userResolvers } from './userResolvers';
import { taskResolvers } from './taskResolvers';
import { taskCompletionResolvers } from './taskCompletionResolvers';

export const resolvers: Resolvers<GraphQLContext> = {
  Query: {
    ...userResolvers.Query,
    ...taskResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...taskResolvers.Mutation
  },
  User: userResolvers.User,
  Task: taskResolvers.Task,
  TaskCompletion: taskCompletionResolvers.TaskCompletion
};
