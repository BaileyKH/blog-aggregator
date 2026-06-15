import { setUser, readConfig } from "./config.js";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./lib/db/queries/users.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler> 

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