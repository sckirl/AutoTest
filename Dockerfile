# Stage 1: Build & Infrastructure
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# 1. Environment Configuration
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=3000

# 2. Install System Dependencies (Java for Appium, essential utils)
RUN apt-get update && apt-get install -y \
    openjdk-11-jre-headless \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 3. Working Directory
WORKDIR /app

# 4. Install Project Dependencies
COPY package*.json ./
RUN npm install --production

# 5. Install Global Appium & Drivers
# We pin versions to ensure 100% compatibility and avoid the version mismatch you encountered
RUN npm install -g appium@2.19.0
RUN appium driver install uiautomator2@2.45.1

# 6. Copy Project Source
COPY . .

# 7. Pre-install Browsers
# This ensures Playwright doesn't try to download them at runtime (which might fail in hardened environments)
RUN npx playwright install chromium

# 8. Expose Ports
EXPOSE 3000
EXPOSE 4723

# 9. Start Script
# We start both Appium (background) and our Studio Server
CMD appium & node studio/server.js