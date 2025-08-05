# ====== Build stage ======
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# ====== Runtime stage ======
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy dist and node_modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy startup script that waits for RabbitMQ and PostgreSQL to be ready before starting the application
COPY startup.sh /startup.sh

# Install wait-for-it dependencies
RUN apk add --no-cache bash curl
# Download the wait-for-it script
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh

# Make the wait-for-it and startup scripts executable
RUN chmod +x /startup.sh /wait-for-it.sh

# Execute the startup script
CMD ["/startup.sh"]