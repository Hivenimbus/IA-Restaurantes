# Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Nuxt application
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
# Expose the port Nuxt uses by default
ENV PORT=3000

# Copy built output from the builder stage
COPY --from=builder /app/.output ./.output

# Expose the configured port
EXPOSE 3000

# Start the Nuxt Nitro server
CMD ["node", ".output/server/index.mjs"]
