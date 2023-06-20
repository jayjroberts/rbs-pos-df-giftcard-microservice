FROM node:18.9.0-alpine3.15

# configure timezone
ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create app directory
RUN mkdir -p /usr/src/app/webapp07-representation-data-apis

# set the working directory
WORKDIR /usr/src/app/webapp07-representation-data-apis

# install app dependencies
COPY package.json /usr/src/app/webapp07-representation-data-apis
RUN npm i -g npm@9.6.4 && \
    npm install && \
    chown -R root:root /root

# Bundle app source
COPY . /usr/src/app/webapp07-representation-data-apis

# Mapping to 80 public port
EXPOSE 80

# Starting the application
CMD [ "node", "index.js" ]