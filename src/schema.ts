// src/schema.ts
import { createSchema } from 'graphql-yoga'
import { readFileSync } from 'fs'
import type { GraphQLContext } from './context'
import { Resolvers } from './types/resolvers-types'

const typeDefs = readFileSync('./src/schema.graphql', 'utf8')

const resolvers: Resolvers<GraphQLContext> = {
  Query: {
    allTasks: async (_parent: unknown, _args: {}, context: GraphQLContext) => {
      return await context.prisma.task.findMany()
    },
    task: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      return await context.prisma.task.findUnique({ where: { id: args.id } })
    },
  },
  Mutation: {
    createTask: async (
      _parent: unknown,
      args: { name: string; description?: string | null },
      context: GraphQLContext
    ) => {
      return await context.prisma.task.create({
        data: {
          name: args.name,
          description: args.description ?? null,
        },
      })
    },
  },
}

export const schema = createSchema({
  typeDefs,
  resolvers,
})
