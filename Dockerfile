# Use official lightweight Python image
FROM python:3.11-slim
# Prevent Python from writing .pyc files & enable unbuffered logging
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy application files
COPY . .
# Expose port (Cloud Run sets PORT environment variable dynamically)
ENV PORT=8080
EXPOSE 8080
# Command to run application using uvicorn
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
