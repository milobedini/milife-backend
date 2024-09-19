// src/schema.ts
import { createSchema } from 'graphql-yoga';
import { readFileSync } from 'fs';
import { taskResolvers } from './resolvers/taskResolvers';
import { userResolvers } from './resolvers/userResolvers';

const typeDefs = readFileSync('./src/schema.graphql', 'utf8');

export const schema = createSchema({
  typeDefs,
  resolvers: [taskResolvers, userResolvers]
});
