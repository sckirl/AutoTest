FROM mcr.microsoft.com/playwright:v1.43.0-jammy

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Ensure browsers are installed
RUN npx playwright install chromium

# Create results directory
RUN mkdir -p results

# Default command: Run the engine
# Note: In Docker, it runs headless. Use local run for Headed mode.
CMD ["npx", "playwright", "test", "core/runner.spec.ts"]
