#Dockerfile is a blueprint for docker image, 
#docker image is a bluerpint for docker container

#Use an official Node runtime as a parent image
# Docker is running is Linux OS
FROM node:18

# Set the working directroy in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the working directory 
COPY package*.json ./

# Install ffmpeg in the container
RUN apt-get update && apt-get install -y ffmpeg

# Install any needed packages specified in package.json
RUN npm install 

# Copy app source inside the docker image
COPY . .

# Make port 3000 available outside this container
EXPOSE 3500

# Define the command to run your app using CMD ( only one CMD allowed)
CMD ["npm", "start"]

