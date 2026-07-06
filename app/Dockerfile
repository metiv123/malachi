FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev || npm install --omit=dev --package-lock=false
COPY . .
ENV MALACHI_PORT=8787
EXPOSE 8787
CMD ["npm", "start"]
