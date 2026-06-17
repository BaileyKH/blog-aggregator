# Blog Aggregator CLI

A command-line RSS feed aggregator built with Node.js, TypeScript, Drizzle ORM, and PostgreSQL. It allows users to register, follow their favorite RSS feeds, and aggregate/browse posts directly from the terminal.

## Prerequisites

Before running the application, make sure you have installed:
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (running locally or hosted)

## Setup

1. **Install dependencies:**
   ```bash
   npm install

2. **Configure environment variables**
    - Create a .env file in the root
    - DATABASE_URL=your-database-connection-string-here

3. **Run database migrations**
   ```bash
   npx drizzle-kit push

4. **Commands**
    - Register a user: ```npm run start register <username>```
    - Log In: ```npm run start login <username>```
    - Delete all users: ```npm run start reset```
    - List registered users: ```npm run start users```
    - Add a feed: ```npm run start addfeed <name> <url>```
    - List all feeds: ```npm run start feeds```
    - Follow a feed: ```npm run start follow <url>```
    - Unfollow a feed: ```npm run start unfollow <url>```
    - List all your followed feeds: ```npm run start following```
    - Start the aggregation: ```npm run start agg <interval>```
    - Browse latest posts: ```npm run start browse [limit]```
