import { getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feeds.js";
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
        console.log(item.title);
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