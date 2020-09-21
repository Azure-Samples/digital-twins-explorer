FROM node:latest

# Create app directory
WORKDIR /usr/src/app/client

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./client/package*.json ./
WORKDIR /usr/src/app/client/src
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
WORKDIR /usr/src/app
COPY . .

# Notify that we want to expose port 3000
EXPOSE 3000
# Actually start the app
WORKDIR /usr/src/app/client/src
CMD npm run start
