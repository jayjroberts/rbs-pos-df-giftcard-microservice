FROM node:18.17-alpine3.18

# configure timezone
ENV TZ="America/New_York"
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create app directory
RUN mkdir -p /usr/src/app/rbs-pos-df-taxes_microservices

RUN chown -R node /usr/src/app/rbs-pos-df-taxes_microservices

# set the working directory
WORKDIR /usr/src/app/rbs-pos-df-taxes_microservices

# install app dependencies
COPY package.json /usr/src/app/rbs-pos-df-taxes_microservices
RUN npm i -g npm@9.6.4 && \
    npm install && \
    chown -R root:root /root

# Bundle app source
COPY . /usr/src/app/rbs-pos-df-taxes_microservices

# Mapping to 8080 public port
EXPOSE 8080
COPY --from=datadog/serverless-init:1-alpine /datadog-init /usr/src/app/datadog-init
COPY --from=datadog/dd-lib-js-init /operator-build/node_modules /dd_tracer/node/
ENV DD_VERSION=$BUILD_ID
ENV DD_TRACE_ENABLED="true"
ENV DD_LOGS_ENABLED="true"
ENV DD_LOGS_INJECTION="true"
 
ENTRYPOINT ["/usr/src/app/datadog-init"]

# Run as non root user
USER node

# Starting the application
CMD [ "node", "index.js" ]
