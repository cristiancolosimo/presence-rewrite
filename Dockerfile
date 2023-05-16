FROM node
# Set working directory

#for inalidating cache
ARG CACHEBUST=1 

# Copy files
COPY . /app
WORKDIR /app

ENV NODE_ENV=development 
ENV DATABASE_URL="file:./database.db"
# Install dependencies
RUN npm install

LABEL org.opencontainers.image.description "HLCS Presence rewrited in Typescript"

CMD ["npm", "run","startprod"]