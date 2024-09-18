
- Node project.
- Express to setup the web server to listen to graphql HTTP requests. Routes requests to the handler -> Yoga GraphQL.
- Yoga processes the request and sends it to the appropriate resolver.
- The Resolvers define how each query/mutation should be executed. Uses Prisma to interact with the DB.
- Prisma acts as intermediary between MongoDB and Yoga.
- MongoDB as the NoSQL database.

Useful Commands
- `npx prisma generate` generates Client based on Prisma schema. Run after you modify the Prisma schema.
- `npx prisma studio` UI to browse and manipulate DB database.
- `npx prisma db pull` introspects DB and updates schema based on current DB state
- `npx prisma db push` pushes schema changes to the DB without creating migration files
- `npx prisma migrate dev` applies migrations and updates local DB
- `npx prisma validate` checks prisma schema for potential errors
- `npx prisma db seed` - populates DB with initial or test data (seed should be defined in `package.json` such as `"prisma": { "seed": "node ./prisma/seed.js" }`
