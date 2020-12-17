FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN chown -R node:node /app
USER node
RUN npm install
COPY --chown=node:node . .
CMD [ "node", "./bin/www" ]