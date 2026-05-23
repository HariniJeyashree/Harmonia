# Use Node LTS light Alpine environment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install packages
RUN npm ci

# Copy the rest of the source files
COPY . .

# Build the client spa and the bundle server.cjs
ENV NODE_ENV=production
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Run the compiled production backend server
CMD ["npm", "start"]