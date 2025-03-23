# app.py (серверная часть)
from flask import Flask, render_template, request, jsonify
from transformers import pipeline
import torch
import os
import librosa
import soundfile as sf
import subprocess
import threading
import queue

app = Flask(__name__)

# Очередь для обработки команд
command_queue = queue.Queue()
current_process = None

# Русская модель распознавания
model = pipeline(
    "automatic-speech-recognition",
    model="bond005/wav2vec2-large-ru-golos",
    device="cuda" if torch.cuda.is_available() else "cpu"
)

ALLOWED_COMMANDS = {
    "выключи компьютер": "suspend",
    "перезагрузи": "reboot",
    "открой браузер": "xdg-open https://yandex.ru",
    "стоп": None
}

def execute_command(cmd):
    global current_process
    if cmd in ALLOWED_COMMANDS.values():
        current_process = subprocess.Popen(
            cmd, 
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

def command_processor():
    while True:
        command = command_queue.get()
        if command == "стоп" and current_process:
            current_process.terminate()
            continue
        
        for phrase, cmd in ALLOWED_COMMANDS.items():
            if phrase in command.lower():
                if cmd:
                    execute_command(cmd)
                break
        command_queue.task_done()

# Запуск фонового обработчика
threading.Thread(target=command_processor, daemon=True).start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_audio():
    audio_file = request.files['audio']
    temp_path = "temp_audio.wav"
    
    audio_file.save(temp_path)
    audio, sr = librosa.load(temp_path, sr=16000)
    sf.write(temp_path, audio, sr)
    
    result = model(temp_path)
    os.remove(temp_path)
    
    command_queue.put(result["text"].lower())
    
    return jsonify({
        "text": result["text"],
        "command": "стоп" if "стоп" in result["text"].lower() else "other"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, ssl_context='adhoc')