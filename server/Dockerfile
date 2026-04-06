FROM node:20-alpine
WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5002/ || exit 1

CMD ["pm2-runtime", "index.js"]
