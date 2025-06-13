# Use a modern, slim Python base image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install uv using pip
RUN pip install --no-cache-dir uv

# Copy only the requirements files to leverage Docker cache
COPY requirements.txt requirements-dev.txt ./

# Install dependencies using uv
# --system: Install into the global site-packages
# --no-cache: Discard the cache to keep the image size down
# --compile-bytecode: Pre-compile .pyc files for faster startup
RUN uv pip install --system --no-cache --compile-bytecode -r requirements.txt

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]