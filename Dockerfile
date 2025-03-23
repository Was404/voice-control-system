FROM python:3.9-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Кэширование зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Предзагрузка модели
RUN python -c "from transformers import pipeline; pipeline('automatic-speech-recognition', model='bond005/wav2vec2-large-ru-golos')"

# Копирование исходного кода
COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]