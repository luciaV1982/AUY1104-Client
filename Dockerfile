FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY index.js ./
COPY test.js ./

CMD ["npm", "start"]