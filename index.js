import { createAudioContext, createOscillator, createGain, connectNodes } from 'https://lsong.org/scripts/audio.js';

const audioContext = createAudioContext();
const analyser = audioContext.createAnalyser();

document.addEventListener('DOMContentLoaded', () => {
  const spectrumAnalyzer = document.querySelector('spectrum-analyzer');
  spectrumAnalyzer.setAnalyser(analyser);
})

const mainGain = createGain(audioContext, { initialGain: 1 });
connectNodes(mainGain, audioContext.destination);
connectNodes(mainGain, analyser);

const volumeControl = document.getElementById('volume');
const bpmControl = document.getElementById('bpm');
const bpmValue = document.getElementById('bpmValue');
const padGrid = document.getElementById('padGrid');
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
  { name: 'Kick', color: '#FF5252', freq: 60 },
  { name: 'Snare', color: '#FF4081', freq: 150 },
  { name: 'Hi-Hat', color: '#E040FB', freq: 800 },
  { name: 'Clap', color: '#7C4DFF', freq: 300 },
  { name: 'Tom', color: '#536DFE', freq: 100 },
  { name: 'Cymbal', color: '#448AFF', freq: 1000 },
  { name: 'Cowbell', color: '#40C4FF', freq: 600 },
  { name: 'Rimshot', color: '#18FFFF', freq: 400 },
  { name: 'Shaker', color: '#64FFDA', freq: 1200 },
  { name: 'Wood', color: '#69F0AE', freq: 500 },
  { name: 'Tri', color: '#B2FF59', freq: 700 },
  { name: 'Tamb', color: '#EEFF41', freq: 900 },
  { name: 'Conga', color: '#FFFF00', freq: 200 },
  { name: 'Bongo', color: '#FFD740', freq: 250 },
  { name: 'Vslap', color: '#FFAB40', freq: 350 },
  { name: 'Silent', color: '#333333', silent: true }
];

volumeControl.addEventListener('input', () => {
  mainGain.gain.setValueAtTime(volumeControl.value, audioContext.currentTime);
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
    const osc = createOscillator(audioContext, { frequency: sound.freq, type: 'sine' });
    const envelope = createGain(audioContext, { initialGain: 0 });

    envelope.gain.setValueAtTime(0, audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

    connectNodes(osc, envelope, mainGain);

    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
  }
  addToSequence(index);
}

function addToSequence(index) {
  if (isRecording && loopSequence.length < 16) {
    loopSequence.push(index);
  }
}

function removeFromSequence(index) {
  if (isRecording && !isLooping) {
    loopSequence.splice(index, 1);
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
});

pauseLoop.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseLoop.textContent = isPaused ? 'Resume' : 'Pause';
});

resetLoop.addEventListener('click', () => {
  loopSequence = [];
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
});