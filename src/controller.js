import * as THREE from 'three';

const statusEl = document.getElementById('status');
const telemetryEl = document.getElementById('telemetry');
const startBtn = document.getElementById('startBtn');
const calibrateBtn = document.getElementById('calibrateBtn');
const roomBadgeEl = document.getElementById('roomBadge');
const helmWheelEl = document.getElementById('helmWheel');
const horizonBandEl = document.getElementById('horizonBand');
const pitchValueEl = document.getElementById('pitchValue');
const rollValueEl = document.getElementById('rollValue');
const pitchBarEl = document.getElementById('pitchBar');
const rollBarEl = document.getElementById('rollBar');
const sourceValueEl = document.getElementById('sourceValue');

// Room ID comes from the URL hash: controller.html#ROOMID
const roomFromHash = window.location.hash.replace('#', '').trim();
const room = roomFromHash || new URLSearchParams(window.location.search).get('room') || 'default';

const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${wsProtocol}://${window.location.host}/controller-relay?role=controller&room=${encodeURIComponent(room)}`);

const state = {
  enabled: false,
  gamePresent: false,
  alpha: 0,
  beta: 0,
  gamma: 0,
  baselineBeta: null,
  baselineGamma: null,
  baselineQuaternionInverse: null,
  activeOrientationEventType: null,
  sensorSource: 'none',
  receivedSensorData: false,
  noSensorTimer: null,
  previousRelativeQuaternion: null,
  motionIntensity: 0,
  lastSent: 0,
  sendIntervalMs: 33
};

const deviceEuler = new THREE.Euler();
const deviceQuaternion = new THREE.Quaternion();
const screenAdjustQuaternion = new THREE.Quaternion();
const deviceFrameQuaternion = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const relativeQuaternion = new THREE.Quaternion();
const identityQuaternion = new THREE.Quaternion();
const zeeAxis = new THREE.Vector3(0, 0, 1);

roomBadgeEl.textContent = `Room ${room.toUpperCase()}`;

function updateFlightDeck(pitch = 0, roll = 0) {
  const rollDegrees = roll * 45;
  const pitchOffset = pitch * 30;
  const normalizedPitch = (pitch + 1) / 2;
  const normalizedRoll = (Math.abs(roll) + 0.05) / 1.05;

  helmWheelEl.style.setProperty('transform', `rotate(${rollDegrees}deg)`);
  horizonBandEl.style.setProperty('transform', `translateY(${pitchOffset}px) rotate(${rollDegrees}deg)`);
  pitchValueEl.textContent = pitch.toFixed(2);
  rollValueEl.textContent = roll.toFixed(2);
  pitchBarEl.style.setProperty('--bar-level', normalizedPitch.toFixed(3));
  rollBarEl.style.setProperty('--bar-level', Math.min(normalizedRoll, 1).toFixed(3));
  sourceValueEl.textContent = state.sensorSource;
}

function setStatus(message) {
  const gameTag = state.gamePresent ? '🎮 Game connected' : '⏳ Waiting for game';
  statusEl.innerHTML = `Room: <strong>${room}</strong> &nbsp;|&nbsp; ${message}<br><small>${gameTag}</small>`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeTilt(value, maxTilt = 35, deadZone = 1.5) {
  if (Math.abs(value) < deadZone) return 0;
  return clamp(value / maxTilt, -1, 1);
}

function getScreenOrientationRadians() {
  if (screen.orientation && typeof screen.orientation.angle === 'number') {
    return THREE.MathUtils.degToRad(screen.orientation.angle);
  }

  if (typeof window.orientation === 'number') {
    return THREE.MathUtils.degToRad(window.orientation);
  }

  return 0;
}

function getCurrentDeviceQuaternion() {
  const alphaRadians = THREE.MathUtils.degToRad(state.alpha || 0);
  const betaRadians = THREE.MathUtils.degToRad(state.beta || 0);
  const gammaRadians = THREE.MathUtils.degToRad(state.gamma || 0);
  const screenOrientationRadians = getScreenOrientationRadians();

  deviceEuler.set(betaRadians, alphaRadians, -gammaRadians, 'YXZ');
  deviceQuaternion.setFromEuler(deviceEuler);
  deviceQuaternion.multiply(deviceFrameQuaternion);
  deviceQuaternion.multiply(screenAdjustQuaternion.setFromAxisAngle(zeeAxis, -screenOrientationRadians));

  return deviceQuaternion.clone();
}

function sendMotion() {
  const now = performance.now();
  if (now - state.lastSent < state.sendIntervalMs) return;
  if (ws.readyState !== WebSocket.OPEN) return;

  const relativeBeta = state.beta - (state.baselineBeta ?? state.beta);
  const relativeGamma = state.gamma - (state.baselineGamma ?? state.gamma);

  const pitch = normalizeTilt(relativeBeta);
  const roll = normalizeTilt(relativeGamma);
  const currentQuaternion = getCurrentDeviceQuaternion();

  if (state.baselineQuaternionInverse == null) {
    state.baselineQuaternionInverse = currentQuaternion.clone().invert();
  }

  relativeQuaternion.copy(state.baselineQuaternionInverse).multiply(currentQuaternion).normalize();

  // Device sensors never sit perfectly still; suppress sub-degree orientation jitter.
  if (relativeQuaternion.angleTo(identityQuaternion) < 0.03) {
    relativeQuaternion.identity();
  }

  const dtSeconds = Math.max((now - state.lastSent) / 1000, 0.001);
  const angularDelta = state.previousRelativeQuaternion
    ? state.previousRelativeQuaternion.angleTo(relativeQuaternion)
    : 0;
  const angularSpeed = angularDelta / dtSeconds;
  const rawMotionIntensity = clamp(angularSpeed / 4.5, 0, 1);
  state.motionIntensity += (rawMotionIntensity - state.motionIntensity) * 0.25;
  state.previousRelativeQuaternion = relativeQuaternion.clone();

  updateFlightDeck(pitch, roll);

  ws.send(JSON.stringify({
    type: 'motion',
    pitch,
    roll,
    quaternion: {
      x: relativeQuaternion.x,
      y: relativeQuaternion.y,
      z: relativeQuaternion.z,
      w: relativeQuaternion.w
    },
    motionIntensity: state.motionIntensity,
    timestamp: Date.now()
  }));

  telemetryEl.textContent =
    `raw α:${state.alpha.toFixed(1)} β:${state.beta.toFixed(1)} γ:${state.gamma.toFixed(1)}` +
    `  |  pitch:${pitch.toFixed(2)}  roll:${roll.toFixed(2)}  thrust:${state.motionIntensity.toFixed(2)} |  src: ${state.sensorSource}`;

  state.lastSent = now;
}

function onOrientation(event) {
  if (!state.enabled) return;

  // Some events fire with null on first few ticks
  if (event.beta == null || event.gamma == null) return;

  if (state.activeOrientationEventType && event.type !== state.activeOrientationEventType) {
    return;
  }

  if (state.activeOrientationEventType == null) {
    state.activeOrientationEventType = event.type;
  }

  state.receivedSensorData = true;
  state.sensorSource = state.activeOrientationEventType;
  if (state.noSensorTimer) {
    clearTimeout(state.noSensorTimer);
    state.noSensorTimer = null;
  }

  state.alpha = event.alpha ?? 0;
  state.beta = event.beta;
  state.gamma = event.gamma;

  // Set baseline on first real reading after enable/recalibrate
  if (state.baselineBeta == null) state.baselineBeta = event.beta;
  if (state.baselineGamma == null) state.baselineGamma = event.gamma;

  sendMotion();
}

async function enableMotion() {
  try {
    if (!window.isSecureContext) {
      setStatus('Motion blocked: open the controller over HTTPS');
      telemetryEl.textContent = 'This browser blocks motion sensors on insecure HTTP pages.';
      return;
    }

    // iOS 13+ requires an explicit permission request triggered by a user gesture
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') {
        setStatus('Motion permission denied');
        return;
      }
    }

    if (!state.enabled) {
      state.activeOrientationEventType = null;
      window.addEventListener('deviceorientation', onOrientation);
      window.addEventListener('deviceorientationabsolute', onOrientation);
      state.enabled = true;
      console.log('[controller] listening on: deviceorientation + deviceorientationabsolute');
    }

    state.noSensorTimer = window.setTimeout(() => {
      if (!state.receivedSensorData) {
        setStatus('No sensor data received');
        telemetryEl.textContent = 'No device orientation events arrived. Check browser sensor permission and use the HTTPS LAN URL.';
      }
    }, 2000);

    setStatus('Motion active — tilt your phone to steer');
  } catch (error) {
    console.error(error);
    setStatus('Failed to enable motion: ' + error.message);
  }
}

function recalibrate() {
  state.baselineBeta = null;   // will be set on next orientation event
  state.baselineGamma = null;
  state.baselineQuaternionInverse = null;
  state.previousRelativeQuaternion = null;
  state.motionIntensity = 0;

  state.receivedSensorData = false;

  if (state.noSensorTimer) {
    clearTimeout(state.noSensorTimer);
  }

  state.noSensorTimer = window.setTimeout(() => {
    if (!state.receivedSensorData) {
      setStatus('No sensor data received');
      telemetryEl.textContent = 'No device orientation events arrived after recalibration.';
    }
  }, 2000);

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'calibrate' }));
  }

  setStatus('Recalibrated — hold phone in neutral position');
  updateFlightDeck(0, 0);
}

startBtn.addEventListener('click', enableMotion);
calibrateBtn.addEventListener('click', recalibrate);

ws.addEventListener('open', () => {
  setStatus('Connected to relay');
});

ws.addEventListener('close', () => {
  setStatus('Disconnected from relay');
});

ws.addEventListener('message', (event) => {
  try {
    const payload = JSON.parse(event.data);

    if (payload.type === 'paired') {
      state.gamePresent = payload.gamePresent === true;
      setStatus(state.gamePresent
        ? 'Paired with game — tap Enable Motion'
        : 'Connected to relay — waiting for game to open');
    }

    if (payload.type === 'game_joined') {
      state.gamePresent = true;
      setStatus('Game joined — tap Enable Motion');
    }

    if (payload.type === 'system' && payload.message) {
      if (payload.message.includes('disconnected') || payload.message.includes('disconnected')) {
        state.gamePresent = false;
      }
      setStatus(payload.message);
    }
  } catch {
    // Ignore invalid payloads
  }
});

updateFlightDeck(0, 0);
