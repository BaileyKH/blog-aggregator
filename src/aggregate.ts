import { getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feeds.js";
import { createPost } from "./lib/db/queries/posts.js";
import { fetchFeed } from "./rssConfig.js";

export async function scrapeFeeds() {
    const nextFeed = await getNextFeedToFetch()

    if (!nextFeed) {
        console.log("No feeds to fetch");
        return;
    }

    const fetchedFeed = await fetchFeed(nextFeed.url)

    if (!fetchedFeed) {
        console.log("No feeds to fetch");
        return;
    }

    await markFeedFetched(nextFeed.id)

    for (const item of fetchedFeed.channel.item) {
        let published = new Date(item.pubDate)
        const pubObj = {
            url: item.link,
            title: item.title,
            description: item.description,
            publishedAt: published,
            feedId: nextFeed.id
        }

        try {
            await createPost(pubObj)
        } catch(err: unknown) {
            if (err instanceof Error) {
                console.error(err.message)
            } else {
                console.log("Unknown error occured", err)
            }
        }

    }

}

// HELPER FUNCTIONS

export function parseDuration(durationStr: string): number {

    let timeBetweenRequests = 0;

    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = durationStr.match(regex);


    switch(match?.[2]) {
        case "ms": 
            timeBetweenRequests = Number(match[1]) * 1
            break;
        case "s":
            timeBetweenRequests = Number(match[1]) * 1000
            break;
        case "m":
            timeBetweenRequests = Number(match[1]) * (1000 * 60)
            break;
        case "h":
            timeBetweenRequests = Number(match[1]) * (1000 * 60 * 60)
            break;
        default:
            throw new Error("Invalid time duration")
    }

    return timeBetweenRequests
}