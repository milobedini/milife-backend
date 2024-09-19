import type { FilterInput, InputMaybe } from '../types/resolvers-types'

// Mapping GraphQL filter operations to Prisma filter operations
const prismaFilterMapping: Record<string, string> = {
  EQUALS: 'equals',
  CONTAINS: 'contains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
}

export const applyFilters = (filters: Array<FilterInput>) => {
  return filters.reduce<Record<string, any>>((acc, filter) => {
    const prismaFilterType = prismaFilterMapping[filter.op]
    if (prismaFilterType) {
      acc[filter.field] = {
        [prismaFilterType]: filter.value,
        mode: 'insensitive',
      }
    }
    return acc
  }, {})
}

/**
 * Filters out null or undefined filters and converts them to a format Prisma can handle
 */
export const processFilters = (
  filters?: Array<InputMaybe<FilterInput>> | null
) => {
  if (!filters || filters.length === 0) return null

  // Filter out null or undefined filters
  const validFilters = filters.filter((f): f is FilterInput => f !== null)

  // If no valid filters, return null
  if (validFilters.length === 0) return null

  // Return the Prisma-compatible filter conditions
  return applyFilters(validFilters)
}
