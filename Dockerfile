FROM node:lts

# build
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

# start
EXPOSE 8443
EXPOSE 80
ENV DEBUG "solid:*" node app.js
COPY fullchain.pem /usr/src/app
COPY privkey.pem /usr/src/app
CMD npm run solid start --redirect-http-from="80,8080,8000" --supress-data-browser
