import { db } from "../index.js";
import { eq, and } from 'drizzle-orm';
import { feedFollows, feeds, users } from "../schema.js";

export async function createFeedFollow(feedTId: string, userTId: string) {
    const [inserted] = await db.insert(feedFollows)
        .values({ feedId: feedTId, userId: userTId })
        .returning();

    const [result] = await db
        .select({
            id: feedFollows.id,
            createdAt: feedFollows.createdAt,
            updatedAt: feedFollows.updatedAt,
            feedId: feedFollows.feedId,
            userId: feedFollows.userId,
            feedName: feeds.name,
            userName: users.name
        })
        .from(feedFollows)
        .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
        .innerJoin(users, eq(feedFollows.userId, users.id))
        .where(eq(feedFollows.id, inserted.id))

    return result
}

export async function getFeedFollowsForUser(userTId: string) {
    const result = await db
        .select({
            id: feedFollows.id,
            createdAt: feedFollows.createdAt,
            updatedAt: feedFollows.updatedAt,
            feedId: feedFollows.feedId,
            userId: feedFollows.userId,
            feedName: feeds.name,
            userName: users.name
        })
        .from(feedFollows)
        .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
        .innerJoin(users, eq(feedFollows.userId, users.id))
        .where(eq(feedFollows.userId, userTId))

    return result
}

export async function checkIfFollowing(userTId: string, feedTId: string) {
    const exists = await db
        .select()
        .from(feedFollows)
        .where(and(
            eq(feedFollows.userId, userTId),
            eq(feedFollows.feedId, feedTId)
        ))

    return exists
}

export async function unfollowFeed(userTId: string, feedTId: string) {

    const [result] = await db
        .delete(feedFollows)
        .where(and(
            eq(feedFollows.userId, userTId),
            eq(feedFollows.feedId, feedTId)
        ))
        .returning()

    return result
}
