FROM node:22-alpine
WORKDIR /app
COPY package.json server.mjs app.js world.js index.html style.css ./
RUN mkdir -p data && printf '{}\n' > data/rooms.json
EXPOSE 4173
CMD ["node", "server.mjs"]
