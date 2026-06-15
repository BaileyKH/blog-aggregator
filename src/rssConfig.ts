import { XMLParser } from "fast-xml-parser";
import { Feed, User } from "./lib/db/schema.js";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

type RSSFeedMetadata = {
  title: string;
  link: string;
  description: string;
};


export async function fetchFeed(feedUrl: string) {
    try {
        const res = await fetch(feedUrl, {
            method: "GET",
            headers: {
                "User-Agent": "gator"
            }
        })
        const data = await res.text()

        const parser = new XMLParser({ processEntities: false })
        let jsObj = parser.parse(data)
        let channelObj = jsObj.rss

        if (!channelObj.channel) {
            throw new Error("No RSS feed found")
        }

        const { title, link, description } = validateFeed(channelObj.channel)

        let items: RSSItem[] = []

        if (Array.isArray(channelObj.channel.item)) {
            items = channelObj.channel.item
        } else if (channelObj.channel.item) {
            items = [channelObj.channel.item]
        }

        const validItems: RSSItem[] = validateItems(items)

        const resultObj: RSSFeed = {
            channel: {
                title: title,
                link: link,
                description: description,
                item: validItems
            }
        }

        return resultObj

    } catch(err: unknown) {
        if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error("An unexpected error occurred", err);
        }
    }
}

// HELPER FUNCTIONS

function validateFeed(feed: any): RSSFeedMetadata {
    if (!feed.title || typeof feed.title !== "string") {
        throw new Error("No feed title found")
    }

    if (!feed.link || typeof feed.link !== "string") {
        throw new Error("No feed link found")
    }

    if (!feed.description || typeof feed.description !== "string") {
        throw new Error("No feed description found")
    }

    return {title: feed.title, link: feed.link, description: feed.description}
}

function validateItems(items: RSSItem[]): RSSItem[] {
    const validItems: RSSItem[] = []

    for (const item of items) {
        if (!item.title || !item.link || !item.description || !item.pubDate) {
            continue
        }

        validItems.push(item)
    }

    return validItems
}

export function printFeed(feed: Feed, user: User) {
    console.log("------------------User------------------")
    console.log("Name: " + user.name)
    console.log("ID: " + user.id)
    console.log("Created: " + user.createdAt)
    console.log("Update: " + user.updatedAt)
    console.log("------------------Feed------------------")
    console.log("User ID: " + feed.userId)
    console.log("Name: " + feed.name)
    console.log("URL: " + feed.url)
    console.log("ID: " + feed.id)
    console.log("Created: " + feed.createdAt)
    console.log("Update: " + feed.updatedAt)
}