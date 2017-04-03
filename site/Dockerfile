FROM nodesource/trusty:6.2.1

MAINTAINER Troy Conrad <troy.conrad@mirumagency.com>

RUN mkdir -p /usr/src/app/site /usr/src/app/common

WORKDIR /usr/src/app/common

# Install common dependencies
COPY /common/package.json /usr/src/app/common
RUN npm install
RUN npm install webpack -g

COPY /common/. /usr/src/app/common

WORKDIR /usr/src/app/site

# Install site dependencies
COPY /site/package.json /usr/src/app/site/
RUN npm install

# Bundle app source
COPY /site/. /usr/src/app/site

# Run build in /usr/src/app/site
RUN npm run build

ENV PORT=8080

# Expose port
EXPOSE ${PORT}

CMD ["/usr/bin/npm", "start"]