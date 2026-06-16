import { db } from "../index.js";
import { eq, sql } from 'drizzle-orm';
import { feeds, users } from '../schema.js';

export async function createFeed(name: string, url: string, userId: string) {
    const [result] = await db.insert(feeds).values({ name: name, url: url, userId: userId }).returning();

    return result;
}

export async function allFeeds() {
    const result = await db
        .select()
        .from(feeds)
        .innerJoin(users, eq(feeds.userId, users.id));

    return result
}

export async function findFeedByUrl(url: string) {
    const [result] = await db
        .select()
        .from(feeds)
        .where(eq(feeds.url, url))

    return result
}

export async function markFeedFetched(feedId: string){
    await db
        .update(feeds)
        .set({
            lastFetchedAt: new Date(),
        })
        .where(eq(feeds.id, feedId))
}

export async function getNextFeedToFetch() {
    const [result] = await db
        .select()
        .from(feeds)
        .orderBy(sql`last_fetched_at ASC NULLS FIRST`)
        .limit(1)

    return result
}