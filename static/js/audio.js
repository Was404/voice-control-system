// static/js/audio.js
let mediaStream;
let audioContext;
let processor;
let isListening = false;

const statusAnimation = document.getElementById('statusAnimation');
const commandDisplay = document.getElementById('commandDisplay');
const cancelButton = document.getElementById('cancelButton');

// Инициализация аудио
async function initAudio() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(mediaStream);
        
        processor = audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        processor.onaudioprocess = processAudio;
        
        setListeningState(true);
        startVisualization();
    } catch (error) {
        showError('Доступ к микрофону запрещен');
    }
}

function processAudio(event) {
    const audioBuffer = event.inputBuffer.getChannelData(0);
    // Здесь можно добавить визуализацию аудио
}

// Управление состоянием
function setListeningState(state) {
    isListening = state;
    statusAnimation.classList.toggle('active', state);
    commandDisplay.textContent = state ? "Слушаю..." : "Готово";
}

async function sendAudioChunk(chunk) {
    const formData = new FormData();
    formData.append('audio', new Blob([chunk], { type: 'audio/wav' }));
    
    try {
        const response = await fetch('/process', { method: 'POST', body: formData });
        const result = await response.json();
        
        handleCommand(result);
    } catch (error) {
        showError('Ошибка связи с сервером');
    }
}

function handleCommand(result) {
    if (result.command === 'стоп') {
        cancelCommand();
        return;
    }
    
    commandDisplay.innerHTML = `
        <div class="command-text">${result.text}</div>
        <div class="processing-animation">
            <div class="dot-flashing"></div>
        </div>
    `;
    
    cancelButton.classList.remove('hidden');
}


function cancelCommand() {
    fetch('/process', {
        method: 'POST',
        body: JSON.stringify({ command: 'стоп' })
    });
    
    // Восстанавливаем статус прослушивания
    commandDisplay.innerHTML = '<div class="canceled">Команда отменена</div>';
    setTimeout(() => {
        commandDisplay.textContent = '';
        setListeningState(true); // Возвращаем статус "Слушаю..."
        startVisualization(); // Перезапускаем визуализацию
    }, 1000);
    
    cancelButton.classList.add('hidden');
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    setTimeout(() => errorElement.remove(), 3000);
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', initAudio);
cancelButton.addEventListener('click', cancelCommand);

// Визуализация
function startVisualization() {
    const canvas = document.createElement('canvas');
    canvas.className = 'audio-visualizer';
    document.body.appendChild(canvas);
    
    // Реализация визуализации волн
}