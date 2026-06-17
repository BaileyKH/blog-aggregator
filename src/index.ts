import type { CommandsRegistry } from "./commands.js";
import { middlewareLoggedIn } from "./middleware.js";
import { 
  registerCommand, 
  handlerLogin, 
  runCommand, 
  handlerRegister, 
  handlerReset, 
  handlerAllUsers, 
  handlerFetchFeed, 
  handlerAddFeed, 
  handlerAllFeeds, 
  handlerFollow,
  handlerFollowedFeeds,
  handlerUnfollowFeed,
  handlerBrowse
} from "./commands.js";

const registry: CommandsRegistry = {};

async function main() {
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerAllUsers);
  registerCommand(registry, "agg", handlerFetchFeed);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "feeds", handlerAllFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowedFeeds));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollowFeed));
  registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

  const commandArgs = process.argv.slice(2)
  const [cmdName, ...rest] = commandArgs

  if (commandArgs.length < 1) {
    console.log("Not enough arguments were provided")
    process.exit(1)
  }

  try {
    await runCommand(registry, cmdName, ...rest)
  } catch(err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error("An unexpected error occurred", err);
    }

    process.exit(1)
  }

  process.exit(0)

}

main();