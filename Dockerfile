FROM node:999999-inexistente

WORKDIR /app

COPY package.json ./
COPY index.js ./
COPY test.js ./

CMD ["npm", "start"]