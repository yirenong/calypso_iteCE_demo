# ---- Stage 1: Build the Vue App ----
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Build the production version of your Vue app
RUN npm run build


# ---- Stage 2: Serve with NGINX ----
FROM nginx:alpine

# Copy compiled files from the build stage to NGINX's html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 8001
EXPOSE 8001

# Start NGINX when the container starts
CMD ["nginx", "-g", "daemon off;"]