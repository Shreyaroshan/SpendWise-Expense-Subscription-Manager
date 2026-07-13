# Use a lightweight official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy local code to the container image
COPY . .

# Expose port (default 8000)
EXPOSE 8000

# Set production environment
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "src/server.js"]
