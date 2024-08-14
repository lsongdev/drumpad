const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

const gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);
gainNode.connect(analyser);

const volumeControl = document.getElementById('volume');
const bpmControl = document.getElementById('bpm');
const bpmValue = document.getElementById('bpmValue');
const padGrid = document.getElementById('padGrid');
const loopVisualization = document.getElementById('loopVisualization');
const loopToggle = document.getElementById('loopToggle');
const pauseLoop = document.getElementById('pauseLoop');
const resetLoop = document.getElementById('resetLoop');
const randomize = document.getElementById('randomize');

let isLooping = false;
let isPaused = false;
let isRecording = true;
let loopInterval;
let loopSequence = [];
let currentStep = 0;

const sounds = [
  { name: 'Kick', color: '#FF5252' },
  { name: 'Snare', color: '#FF4081' },
  { name: 'Hi-Hat', color: '#E040FB' },
  { name: 'Clap', color: '#7C4DFF' },
  { name: 'Tom', color: '#536DFE' },
  { name: 'Cymbal', color: '#448AFF' },
  { name: 'Cowbell', color: '#40C4FF' },
  { name: 'Rimshot', color: '#18FFFF' },
  { name: 'Shaker', color: '#64FFDA' },
  { name: 'Wood', color: '#69F0AE' },
  { name: 'Tri', color: '#B2FF59' },
  { name: 'Tamb', color: '#EEFF41' },
  { name: 'Conga', color: '#FFFF00' },
  { name: 'Bongo', color: '#FFD740' },
  { name: 'Vslap', color: '#FFAB40' },
  { name: 'Silent', color: '#333333', silent: true }
];

volumeControl.addEventListener('input', () => {
  gainNode.gain.setValueAtTime(volumeControl.value, audioContext.currentTime);
});

bpmControl.addEventListener('input', () => {
  bpmValue.textContent = bpmControl.value;
  if (isLooping && !isPaused) {
    clearInterval(loopInterval);
    startLoop();
  }
});

sounds.forEach((sound, index) => {
  const pad = document.createElement('button');
  pad.className = 'pad';
  pad.style.backgroundColor = sound.color;
  pad.textContent = sound.name;
  pad.dataset.index = index;
  pad.addEventListener('click', () => playSound(index));
  padGrid.appendChild(pad);
});

function playSound(index) {
  const sound = sounds[index];
  if (!sound.silent) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200 + index * 100, audioContext.currentTime);

    const envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(0, audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

    oscillator.connect(envelope);
    envelope.connect(gainNode);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  }
  addToSequence(index);
}

function addToSequence(index) {
  if (isRecording && loopSequence.length < 16) {
    loopSequence.push(index);
    updateLoopVisualization();
  }
}

function removeFromSequence(index) {
  if (isRecording && !isLooping) {
    loopSequence.splice(index, 1);
    updateLoopVisualization();
  }
}

function updateLoopVisualization() {
  loopVisualization.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const stepElement = document.createElement('div');
    stepElement.className = 'loop-step';
    if (i < loopSequence.length) {
      stepElement.style.backgroundColor = sounds[loopSequence[i]].color;
      stepElement.addEventListener('click', () => removeFromSequence(i));
    } else {
      stepElement.style.backgroundColor = '#333';
    }
    loopVisualization.appendChild(stepElement);
  }
}

function updateLoopProgress() {
  const loopSteps = document.querySelectorAll('.loop-step');
  loopSteps.forEach((step, index) => {
    step.classList.toggle('active', index === currentStep);
  });
}

function startLoop() {
  if (loopSequence.length > 0) {
    loopInterval = setInterval(() => {
      if (!isPaused) {
        playSound(loopSequence[currentStep]);
        updateLoopProgress();
        currentStep = (currentStep + 1) % loopSequence.length;
      }
    }, 60000 / parseInt(bpmControl.value));
  }
}

loopToggle.addEventListener('click', () => {
  if (isLooping) {
    clearInterval(loopInterval);
    loopToggle.textContent = 'Start';
    isLooping = false;
    isPaused = false;
    currentStep = 0;
    isRecording = true;
    updateLoopProgress();
  } else {
    if (loopSequence.length > 0) {
      startLoop();
      loopToggle.textContent = 'Stop';
      isLooping = true;
      isPaused = false;
      isRecording = false;
    }
  }
  updateLoopVisualization();
});

pauseLoop.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseLoop.textContent = isPaused ? 'Resume' : 'Pause';
});

resetLoop.addEventListener('click', () => {
  loopSequence = [];
  updateLoopVisualization();
  clearInterval(loopInterval);
  isLooping = false;
  isPaused = false;
  currentStep = 0;
  isRecording = true;
  updateLoopProgress();
  loopToggle.textContent = 'Start';
  pauseLoop.textContent = 'Pause';
});

randomize.addEventListener('click', () => {
  loopSequence = Array.from({ length: 16 }, () => Math.floor(Math.random() * sounds.length));
  updateLoopVisualization();
});

function drawVisualizer() {
  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const width = canvas.width;
  const height = canvas.height;

  function draw() {
    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = 'rgb(44, 44, 44)';
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;

      ctx.fillStyle = 'rgb(255, 50, 50)';
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  draw();
}

drawVisualizer();
window.addEventListener('resize', drawVisualizer);

// Initial setup
updateLoopVisualization();