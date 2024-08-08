FROM node:22 AS base

RUN apt-get update && apt-get install -y curl

WORKDIR /app

COPY package*.json /app

RUN npm ci

COPY index.js /app

EXPOSE 3000
CMD ["npm", "start"]

FROM base AS prod

ARG DATABASE_SSL_CA_URL

ENV DATABASE_SSL_CA="/database-ssl-ca.pem"

RUN curl -s $DATABASE_SSL_CA_URL -o $DATABASE_SSL_CA
