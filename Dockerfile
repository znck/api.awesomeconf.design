FROM node

RUN npm install --global pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml /app/

RUN pnpm install --frozen-lockfile --production

COPY dist/ /app/dist/

EXPOSE 80

CMD [ "npm", "start" ]
