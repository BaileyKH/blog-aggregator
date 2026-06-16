import { readConfig } from "./config.js";
import { getUserByName } from "./lib/db/queries/users.js";
import type { CommandHandler } from "./commands.js";
import type { User } from "./lib/db/schema.js";

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const { currentUserName } = readConfig()

    if (!currentUserName) {
        throw new Error("No user logged in")
    }

    const user = await getUserByName(currentUserName)

    if (!user) {
        throw new Error("No user found")
    }

    await handler(cmdName, user, ...args)

  };
} 