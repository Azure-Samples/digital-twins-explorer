FROM node:current-slim

# Install required dependencies
RUN apt-get update
RUN apt-get -y install curl python make g++

# Install the Azure CLI, which will be required for authentication
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Create app directory
WORKDIR /usr/src/app/client

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./client/package*.json ./
WORKDIR /usr/src/app/client/src
RUN npm install

# Bundle app source
WORKDIR /usr/src/app
COPY . .
WORKDIR /usr/src/app/client/src

# Notify that we want to expose port 3000
EXPOSE 3000
# Create startup script & start the app
WORKDIR /usr/src/app/client/src
RUN printf "#!/bin/sh\nset -e\naz login && npm run start" > startup.sh
RUN chmod 0755 startup.sh
ENTRYPOINT ["./startup.sh"]
