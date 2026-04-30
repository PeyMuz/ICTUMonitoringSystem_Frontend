# Use the official, lightweight Nginx Alpine image
FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom routing configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy all the HTML, CSS, and JS files into the web directory
COPY . /usr/share/nginx/html

# Expose Port 80 for web traffic
EXPOSE 80