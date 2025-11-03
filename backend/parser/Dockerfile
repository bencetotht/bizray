FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Init Python
WORKDIR /app
COPY .. /app/
RUN pip install --no-cache-dir -r requirements.txt tqdm psycopg sqlalchemy

# Install unzip for processing mounted archives
RUN apt-get update && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*

# At run: unzip mounted dataset and then run parser
# Expects a zip mounted at /data/dataset.zip
CMD ["/bin/sh", "-c", "unzip -o /data/dataset.zip -d /Users/bencetoth/Downloads/bizrayds/ && python parser.py"]


