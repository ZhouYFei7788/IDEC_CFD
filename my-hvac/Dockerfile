# Use a multi-stage build to create a tiny image serving the built app
# ---------- Builder stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (only package.json and package-lock.json are needed for npm ci)
COPY package*.json ./
RUN npm ci --silent

# Copy the rest of the source code
COPY . ./

# Build the production assets (Vite will output to the dist/ folder)
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:alpine
# Copy the built static files into Nginx's default html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the default HTTP port
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
