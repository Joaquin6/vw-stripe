#!/bin/sh

docker build -t vision-wheel-dealers -f site/Dockerfile . && docker run -it -e NODE_ENV=qa -p 8080:8080 vision-wheel-dealers