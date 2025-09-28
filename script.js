const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const timeDisplay = document.getElementById("time-display");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const statusMessage = document.getElementById("status-message");
const toastTemplate = document.getElementById("toast-template");
const presetButtons = document.querySelectorAll(".preset");

let intervalId = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;
let isPaused = false;
let initialSeconds = 0;
let audioContext;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function getInputSeconds() {
  const minutes = clamp(parseInt(minutesInput.value, 10) || 0, 0, 99);
  const seconds = clamp(parseInt(secondsInput.value, 10) || 0, 0, 59);
  return minutes * 60 + seconds;
}

function formatTime(total) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateDisplay(seconds) {
  timeDisplay.textContent = formatTime(Math.max(0, seconds));
}

function updateInputs(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  minutesInput.value = String(minutes).padStart(2, "0");
  secondsInput.value = String(remaining).padStart(2, "0");
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function clearTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    if (!audioContext) {
      audioContext = new AudioCtx();
    }

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.9);
  } catch (error) {
    console.warn("Audio konnte nicht abgespielt werden", error);
  }
}

function showToast() {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  const closeBtn = toast.querySelector(".toast__close");
  const removeToast = () => {
    toast.classList.add("is-hidden");
    setTimeout(() => toast.remove(), 250);
  };

  closeBtn.addEventListener("click", removeToast, { once: true });
  document.body.appendChild(toast);

  setTimeout(removeToast, 4500);
}

function startCountdown() {
  clearTimer();
  intervalId = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearTimer();
      isRunning = false;
      isPaused = false;
      pauseBtn.disabled = true;
      pauseBtn.textContent = "Pausieren";
      startBtn.disabled = false;
      startBtn.textContent = "Start";
      setStatus("Zeit abgelaufen!");
      updateDisplay(0);
      updateInputs(0);
      showToast();
      playChime();
      return;
    }

    remainingSeconds -= 1;
    updateDisplay(remainingSeconds);
    updateInputs(remainingSeconds);
  }, 1000);
}

function handleStart() {
  if (isRunning) {
    return;
  }

  const seconds = getInputSeconds();
  if (seconds <= 0) {
    setStatus("Bitte gib eine Zeit größer als 0 ein.");
    updateDisplay(0);
    return;
  }

  initialSeconds = seconds;
  totalSeconds = seconds;
  remainingSeconds = seconds;

  updateDisplay(remainingSeconds);
  updateInputs(remainingSeconds);
  startCountdown();

  isRunning = true;
  isPaused = false;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  pauseBtn.textContent = "Pausieren";
  setStatus("Timer läuft...");
}

function handlePause() {
  if (!isRunning) {
    return;
  }

  if (!isPaused) {
    clearTimer();
    isPaused = true;
    pauseBtn.textContent = "Fortsetzen";
    setStatus("Timer pausiert.");
  } else {
    isPaused = false;
    pauseBtn.textContent = "Pausieren";
    setStatus("Weiter geht's!");
    startCountdown();
  }
}

function handleReset() {
  clearTimer();
  isRunning = false;
  isPaused = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "Pausieren";
  startBtn.disabled = false;
  startBtn.textContent = "Start";
  resetBtn.disabled = true;

  const seconds = initialSeconds || 0;
  remainingSeconds = seconds;
  updateDisplay(seconds);
  updateInputs(seconds);
  setStatus("Bereit.");
}

function handlePresetClick(event) {
  const seconds = Number.parseInt(event.currentTarget.dataset.seconds, 10);
  if (Number.isNaN(seconds)) {
    return;
  }

  clearTimer();
  isRunning = false;
  isPaused = false;
  totalSeconds = seconds;
  initialSeconds = seconds;
  remainingSeconds = seconds;
  updateDisplay(seconds);
  updateInputs(seconds);
  startBtn.disabled = false;
  startBtn.textContent = "Start";
  pauseBtn.disabled = true;
  resetBtn.disabled = false;
  setStatus("Zeit übernommen. Drücke auf Start!");
}

startBtn.addEventListener("click", handleStart);
pauseBtn.addEventListener("click", handlePause);
resetBtn.addEventListener("click", handleReset);

presetButtons.forEach((button) => {
  button.addEventListener("click", handlePresetClick);
});

updateDisplay(0);
updateInputs(0);
