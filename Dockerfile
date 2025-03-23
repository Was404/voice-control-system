FROM python:3.9-slim

# Устанавливаем только необходимые зависимости
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Кэширование модели (опционально)
RUN python -c "from transformers import pipeline; pipeline('automatic-speech-recognition', model='bond005/wav2vec2-large-ru-golos')"

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]