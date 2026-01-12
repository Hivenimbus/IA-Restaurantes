import { auth } from "~~/server/utils/auth"; // Accessing server util

export default defineEventHandler((event) => {
    return auth.handler(toWebRequest(event));
});
