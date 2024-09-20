import type { FilterInput, InputMaybe } from './resolvers-types';

export type FilterArgs = InputMaybe<Array<InputMaybe<FilterInput>>>;

export type MessageReturn = {
  message: string;
};
