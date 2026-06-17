import { db } from "../index.js";
import { eq, desc } from 'drizzle-orm';
import { posts, feedFollows, users, feeds } from "../schema.js";
import type { Post } from "../schema.js";

export async function createPost(post: Post) {
    const [inserted] = await db
        .insert(posts)
        .values(post)
        .returning()

    return inserted
}

export async function getPostsForUser(userTId: string, limit: number) {
    const result = await db
        .select({
            id: posts.id,
            title: posts.title,
            url: posts.url,
            description: posts.description,
            publishedAt: posts.publishedAt,
            feedName: feeds.name,
        })
        .from(posts)
        .innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
        .innerJoin(users, eq(feedFollows.userId, users.id))
        .where(eq(feedFollows.userId, userTId))
        .orderBy(desc(posts.publishedAt))
        .limit(limit)

    return result
}
