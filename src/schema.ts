// src/schema.ts
import { createSchema } from 'graphql-yoga'
import { readFileSync } from 'fs'
import { taskResolvers } from './resolvers/taskResolvers'

const typeDefs = readFileSync('./src/schema.graphql', 'utf8')

export const schema = createSchema({
  typeDefs,
  resolvers: [taskResolvers],
})
