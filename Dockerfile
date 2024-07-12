FROM node:20.10.0-alpine AS base
WORKDIR /app

ENV YARN_VERSION=4.1.1
RUN apk add --no-cache libc6-compat

RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

FROM base AS build
ENV NODE_ENV production
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable && yarn cache clean

COPY --chown=node:node . .

RUN yarn build

USER node

FROM base AS production-stage
WORKDIR /app
ENV NODE_ENV production
COPY --chown=node:node --from=build /app/dist dist
COPY --chown=node:node --from=build /app/node_modules node_modules
COPY --chown=node:node --from=build /app/package.json package.json

USER node
CMD ["yarn", "start"]
