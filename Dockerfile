FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY . .
RUN npx prisma generate

# Start NestJS in watch mode
CMD ["npm", "run", "start:dev"]
