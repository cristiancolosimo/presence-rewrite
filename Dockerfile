FROM node:slim
# Set working directory
WORKDIR /app

#for inalidating cache
ARG CACHEBUST=1 

# Copy files
COPY package.json .
COPY package-lock.json .
COPY index.ts .
COPY views .
COPY prisma .
COPY static .
COPY src .

# Install dependencies
RUN apt-get update && apt-get install -y python3 python3-pip
RUN npm install

CMD ["npm", "start"]