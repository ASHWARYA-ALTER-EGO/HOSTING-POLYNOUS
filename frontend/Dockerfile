# ============ BUILD STAGE ============
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============ PRODUCTION STAGE ============
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user
RUN adduser -D -s /bin/sh polynous && \
    chown -R polynous:polynous /usr/share/nginx/html && \
    chown -R polynous:polynous /var/cache/nginx && \
    chown -R polynous:polynous /var/log/nginx && \
    chown -R polynous:polynous /etc/nginx/conf.d

USER polynous

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]