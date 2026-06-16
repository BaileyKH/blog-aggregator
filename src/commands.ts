import { setUser, readConfig } from "./config.js";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./lib/db/queries/users.js";
import { fetchFeed, printFeed } from "./rssConfig.js";
import { createFeed, allFeeds, findFeedByUrl } from "./lib/db/queries/feeds.js";
import { createFeedFollow, getFeedFollowsForUser, checkIfFollowing } from "./lib/db/queries/followFeeds.js";

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
    if (args.length > 0) {
        throw new Error("Too many arguments passed")
    }

    const feed = await fetchFeed("https://www.wagslane.dev/index.xml")

    console.log(JSON.stringify(feed, null, 2))
}

export async function handlerAddFeed(cmdName: string, ...args: string[]) {
    if (args.length !== 2) {
        throw new Error(`${cmdName} Unsuccessful: Name and URL are required`)
    }

    try {
        const name = args[0]
        const url = args[1]
        const currentUser = await readConfig()
        const userInfo = await getUserByName(currentUser.currentUserName)

        const createdFeed = await createFeed(name, url, userInfo.id)
        await createFeedFollow(createdFeed.id, userInfo.id)

        return printFeed(createdFeed, userInfo)

    } catch(err: unknown) {
        if (err instanceof Error) {
            console.error(err.message)
        } else {
            console.error("An unexpected error occurred", err);
        }

        process.exit(1)
    }
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
export async function handlerFollow(cmdName: string, ...args: string[]) {
    const currentUser = readConfig()

    try {

        if (args.length !== 1) {
            throw new Error(`${cmdName} Unsuccessful: Feed URL required`)
        }

        const feedUrl = args[0]

        const getFeed = await findFeedByUrl(feedUrl)

        if (!getFeed) {
            throw new Error("No feed with that url could be found. Please try again.")
        }

        const { id } = await getUserByName(currentUser.currentUserName)

        const checkFollows = await checkIfFollowing(id, getFeed.id)

        if (checkFollows.length > 0) {
            throw new Error("You already follow this feed")
        }

        const followedFeed = await createFeedFollow(getFeed.id, id)

        console.log("----------Now Following Feed----------")
        console.log("Name: ", followedFeed.feedName)
        console.log("User: ", followedFeed.userName)


    } catch(err: unknown) {
        if (err instanceof Error) {
            console.error(err.message)
            process.exit(1)
        } else {
            console.error("An unexpected error occurred", err);
        }
    }

}

export async function handlerFollowedFeeds(cmdName: string, ...args: string[]) {
    const currentUser = readConfig()

    if (args.length > 0) {
        throw new Error("Too many arguments passed")
    }

    try {
        const { id } = await getUserByName(currentUser.currentUserName)
        const followedFeeds = await getFeedFollowsForUser(id)

        if (followedFeeds.length < 1) {
            throw new Error("User does not currently follow any feeds")
        }

        console.log(`-----Feeds for ${currentUser.currentUserName}-----`)
        for (let i = 0; i < followedFeeds.length; i++){
            console.log("Feed Name: " + followedFeeds[i].feedName)
        }

    } catch(err: unknown) {
        if (err instanceof Error) {
            console.error(err.message)
            process.exit(1)
        } else {
            console.log("An unexpected error occurred", err)
        }
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