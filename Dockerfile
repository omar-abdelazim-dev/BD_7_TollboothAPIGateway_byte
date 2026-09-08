FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
RUN mkdir -p /app/logs && chown -R node:node /app
USER node
CMD ["node","src/gateway/server.js"]
