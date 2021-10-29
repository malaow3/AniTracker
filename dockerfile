FROM node:16.11.0
ENV NODE_ENV=production

WORKDIR /app
EXPOSE 42069

COPY "anitracker-1.0.0.tgz" ./
# COPY ./.env ./.env 

RUN npm install -g anitracker-1.0.0.tgz


CMD ["anitracker"]