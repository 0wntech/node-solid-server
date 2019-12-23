FROM node:8.11.2-onbuild
EXPOSE 8443
EXPOSE 80
ENV DEBUG "solid:*" node app.js
CMD npm run solid start --redirect-http-from="80,8080,8000" --supress-data-browser
