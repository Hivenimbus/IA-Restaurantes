import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { admin } from "better-auth/plugins"
import * as schema from "~~/server/database/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "postgres.js"
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications
        }
    }),
    emailAndPassword: {
        enabled: true
    },
    plugins: [
        admin()
    ]
});
