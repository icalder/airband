FROM node:lts-alpine as build-stage
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM alpine as production-stage
RUN apk add --no-cache tini && \
  apk add mini_httpd && \
  rm -rf /var/cache/apk/*

# Create a non-root user to own the files and run our server
RUN adduser -D static
USER static
WORKDIR /home/static

COPY --from=build-stage /build/dist .

EXPOSE 8000

ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "mini_httpd", "-p", "8000", "-u", "static", "-l", "/dev/stdout" , "-D"]