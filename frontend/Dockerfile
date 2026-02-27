# Dockerfile for React Frontend (Development)
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodeapp && \
    adduser -S nodeapp -u 1001 -G nodeapp

WORKDIR /app

# Copy package files for dependency caching
COPY --chown=nodeapp:nodeapp package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY --chown=nodeapp:nodeapp . .

# Switch to non-root user
USER nodeapp:nodeapp

# Expose Vite dev server port
EXPOSE 5173

# Health check for Vite dev server
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Start Vite dev server with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
