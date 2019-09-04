FROM node as build

RUN npm install --global pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/
RUN pnpm install --frozen-lockfile
COPY . /app/
RUN pnpm run build


#<--------------{ APP }--------------->#

FROM node

RUN npm install --global pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/
RUN pnpm install --frozen-lockfile
COPY --from=build /app/dist /app/dist

EXPOSE 80

CMD [ "npm", "start" ]
