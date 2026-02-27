# Use official Playwright image for pre-installed browser dependencies
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Install Node.js (already in the image, but ensuring version compatibility)
# The playwright image usually includes a compatible node version.

# Copy package files
COPY package*.json ./

# Install dependencies (ignoring scripts that might try to download browsers again)
# Playwright browsers are already in the base image.
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to Javascript
RUN npm run build

# Cloud Run provides a PORT env var, we must listen on it.
# We'll ensure proxy-config.ts respects this.
EXPOSE 3000

# Start the server using the compiled output
CMD [ "node", "lib/proxy-server.js" ]
