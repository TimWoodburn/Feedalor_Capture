FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install OS-level dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
    libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 \
    libxcomposite1 libxdamage1 libxrandr2 xdg-utils wget \
    ca-certificates fonts-liberation netcat-openbsd \
    libxshmfence1 libxss1 libxtst6 libwayland-client0 libwayland-cursor0 \
    libwayland-egl1 libx11-dev libx11-xcb-dev libgbm-dev \
    libjpeg-dev libpng-dev libpango-1.0-0 libcairo2 libpangoft2-1.0-0 \
    libharfbuzz0b libegl1-mesa mesa-utils libxkbcommon0 \
    curl gnupg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Playwright Chromium
RUN pip install playwright && playwright install chromium

# Copy frontend source
COPY frontend/ /app/frontend/
WORKDIR /app/frontend

# Install frontend deps (including Vite and React)
RUN npm install

# Install missing plugin (even if not listed in package.json)
RUN npm install -D @vitejs/plugin-react

# Build frontend
RUN npm run build

# Switch back to backend workdir
WORKDIR /app

# Install Python backend dependencies
COPY requirements.txt .
COPY .env.keys .
COPY .env . 
COPY config.py .



RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY app/ app/
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN sed -i 's/\r$//' entrypoint.sh

# Copy frontend build into Flask static directory
RUN mkdir -p /app/app/static/frontend
RUN cp -r /app/frontend/dist/* /app/app/static/frontend/

# Expose port
EXPOSE 5001

# Launch the app
ENTRYPOINT ["./entrypoint.sh"]
