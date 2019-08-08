# base image
#FROM node:9.6.1
FROM node:latest

# set working directory (also creates two folders needed for cypress)
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install app and cache app dependencies
COPY . /usr/src/app
#RUN npm install
#RUN npm audit fix
RUN yarn
# RUN openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem -subj '/CN=www.mydom.com/O=My Company Name LTD./C=US'

# start app
CMD ["npm", "run", "docker-start"]
