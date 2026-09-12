# Use official lightweight Node.js 22 LTS on Alpine Linux
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy package files first
COPY package*.json ./

# Copy all application files
COPY . .

# Expose web server port
EXPOSE 3000

# Health check for Vultr Load Balancer / Container Monitor
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Start the game server
CMD ["node", "server.js"]
