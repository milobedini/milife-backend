import 'dotenv/config'; // Ensure environment variables are loaded

import { schema } from './schema';
import { createYoga } from 'graphql-yoga';
import { createContext } from './context';
import { createServer } from 'http';

function main() {
  const yoga = createYoga({ schema, context: createContext });
  const server = createServer(yoga);

  server.listen(4000, () => {
    console.log('Server is running on http://localhost:4000/graphql');
  });
}

main();
