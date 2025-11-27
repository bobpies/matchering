FROM python:3.10-slim

# Matchering 2025 - Multi-Reference Hot or Not
# Based on Matchering 2.0 by Sergree
# Modified 2025 - GPLv3

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p uploads results previews

# Expose port
EXPOSE 8360

# Set environment variable (disable debug in production)
ENV FLASK_DEBUG=False

# Run the application
CMD ["python", "app.py"]

