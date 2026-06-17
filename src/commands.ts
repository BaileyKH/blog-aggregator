import { User } from "./lib/db/schema.js";
import { setUser, readConfig } from "./config.js";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./lib/db/queries/users.js";
import { fetchFeed, printFeed } from "./rssConfig.js";
import { createFeed, allFeeds, findFeedByUrl } from "./lib/db/queries/feeds.js";
import { getPostsForUser } from "./lib/db/queries/posts.js";
import { createFeedFollow, getFeedFollowsForUser, checkIfFollowing, unfollowFeed } from "./lib/db/queries/followFeeds.js";
import { scrapeFeeds, parseDuration } from "./aggregate.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler> 

// User Handlers
export async function handlerLogin(cmdName: string, ...args: string[]) {
    if (args.length < 1) {
        throw new Error(`${cmdName} Unsuccessful: Username Required`)
    }

    const user = await getUserByName(args[0])

    if (!user) {
        throw new Error("User does not exist, please register as a new user")
    }

    setUser(args[0])
    
    console.log(`${args[0]} successfully logged in`)
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
    const existingUser = await getUserByName(args[0])
    if (args.length < 1) {
        throw new Error(`${cmdName} Unsuccessful: Name Required`)
    }

    if (existingUser) {
        throw new Error("User already exists")
    }

    const newUser = await createUser(args[0])
    setUser(newUser.name)

    console.log("New User was created: " + newUser.name)

}

export async function handlerReset(cmdName: string, ...args: string[]) {
    if (args.length > 0) {
        throw new Error("Too many arguments passed")
    }

    try {
        await deleteAllUsers()

        console.log("All users and data has been deleted")
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

export async function handlerAllUsers(cmdName: string, ...args: string[]) {
    if (args.length > 0) {
        throw new Error("Too many arguments passed")
    }

    try{
        const users = await getUsers()

        const currentUser = readConfig()

        if (users.length < 1) {
            throw new Error("There are currently no users")
        }
        
        for (let i = 0; i < users.length; i++) {
        
            if (users[i].name === currentUser.currentUserName) {
                console.log(`* ${users[i].name} (current)`)
            } else {
                console.log(`* ${users[i].name}`)
            }

        }
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

// Feed Handlers
export async function handlerFetchFeed(cmdName: string, ...args: string[]) {
    if (args.length !== 1) {
        throw new Error("Pass only one argument, duration")
    }

    const timeBetweenRequests = parseDuration(args[0]);
    console.log(`Collecting feeds every ${args[0]}`);

    scrapeFeeds().catch((err) => console.error(err.message));

    const interval = setInterval(() => {
        scrapeFeeds().catch((err) => console.error(err.message));
    }, timeBetweenRequests);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]) {
    if (args.length !== 2) {
        throw new Error(`${cmdName} Unsuccessful: Name and URL are required`)
    }

    const name = args[0]
    const url = args[1]

    const createdFeed = await createFeed(name, url, user.id)
    await createFeedFollow(createdFeed.id, user.id)

    return printFeed(createdFeed, user)

}

export async function handlerAllFeeds(cmdName: string, ...args: string[]) {
    if (args.length > 0) {
        throw new Error("Too many arguments passed")
    }

    const feeds = await allFeeds()

    for (let i = 0; i < feeds.length; i++) {
        console.log("-----------------------")
        console.log("User: " + feeds[i].users.name)
        console.log("Title: " + feeds[i].feeds.name)
        console.log("URL: " + feeds[i].feeds.url)
        console.log("-----------------------")
    }
}

// Follower Handlers
export async function handlerFollow(cmdName: string, user: User, ...args: string[]) {

    if (args.length !== 1) {
        throw new Error(`${cmdName} Unsuccessful: Feed URL required`)
    }

    const feedUrl = args[0]

    const getFeed = await findFeedByUrl(feedUrl)

    if (!getFeed) {
        throw new Error("No feed with that url could be found. Please try again.")
    }


    const checkFollows = await checkIfFollowing(user.id, getFeed.id)

    if (checkFollows.length > 0) {
        throw new Error("You already follow this feed")
    }

    const followedFeed = await createFeedFollow(getFeed.id, user.id)

    console.log("----------Now Following Feed----------")
    console.log("Name: ", followedFeed.feedName)
    console.log("User: ", followedFeed.userName)

}

export async function handlerFollowedFeeds(cmdName: string, user: User,  ...args: string[]) {

    if (args.length > 0) {
        throw new Error("Too many arguments passed")
    }

    const followedFeeds = await getFeedFollowsForUser(user.id)

    if (followedFeeds.length < 1) {
        console.log("User does not currently follow any feeds")
        return
    }

    console.log(`-----Feeds for ${user.name}-----`)
    for (let i = 0; i < followedFeeds.length; i++){
        console.log("Feed Name: " + followedFeeds[i].feedName)
    }

}

export async function handlerUnfollowFeed(cmdName: string, user: User, ...args: string[]) {
    if (args.length !== 1) {
        throw new Error("Please provide just the feed url")
    }

    const feed = await findFeedByUrl(args[0])

    if (!feed) {
        throw new Error("No feed found")
    }
    

    const deletedFeed = await unfollowFeed(user.id, feed.id)

    if (!deletedFeed) {
        throw new Error("You did not follow this feed")
    }

    console.log("Feed has been Unfollowed")

}

// Post Handlers

export async function handlerBrowse(cmdName: string, user: User, ...args: string[]) {
    if (args.length > 1) {
        throw new Error("Max One argument allowed")
    }

    let limit = args.length > 0 ? Number(args[0]) : 2

    const posts = await getPostsForUser(user.id, limit)

    console.log("--------Your Posts--------")

    for (let i = 0; i < posts.length; i++) {
        console.log("Name: ", posts[i].feedName)
        console.log("Title: ", posts[i].title)
        console.log("URL: ", posts[i].url)
        console.log("Description: ", posts[i].description)
        console.log("Published: ", posts[i].publishedAt)
    }

}

// Initial command setup
export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    const handler = registry[cmdName]

    if (!handler) {
        throw new Error("No handler registered for this command")
    }

    await handler(cmdName, ...args)

}