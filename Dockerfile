FROM python:3.9-slim

WORKDIR /app

COPY requirements .

RUN pip install --no-cache-dir -r requirements

COPY . .

EXPOSE 8000

CMD ["gunicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]