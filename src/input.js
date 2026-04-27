import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import QRCode from 'qrcode';
import { starMaterialUniforms } from './starField';
import { ChangedShipPos, ship } from './scene';

export function InputListener(camera, renderer) {
  const controls = new PointerLockControls(camera, document.body);

  const remoteMotion = {
    vertical: 0,
    horizontal: 0,
    targetVertical: 0,
    targetHorizontal: 0,
    motionIntensity: 0,
    targetMotionIntensity: 0,
    speed: 0.12,
    smoothing: 0.14,
    speedSmoothing: 0.12,
    minSpeedMultiplier: 0.25,
    maxSpeedMultiplier: 3.2,
    targetQuaternion: new THREE.Quaternion(),
    hasQuaternion: false,
    rotationSmoothing: 0.10,
    maxRotationStepRadians: THREE.MathUtils.degToRad(2.0),
    connectedControllers: 0
  };
  const shipBaseQuaternion = ship ? ship.quaternion.clone() : new THREE.Quaternion();
  const shipTargetQuaternion = new THREE.Quaternion();
  const shipRelativeQuaternion = new THREE.Quaternion();
  const shipBlendedQuaternion = new THREE.Quaternion();

  const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${window.location.host}/controller-relay?role=game&room=${encodeURIComponent(roomId)}`;
  let controllerOrigin = window.location.origin;

  const pairingBanner = document.createElement('div');
  pairingBanner.style.position = 'fixed';
  pairingBanner.style.top = '12px';
  pairingBanner.style.left = '12px';
  pairingBanner.style.padding = '12px 14px';
  pairingBanner.style.maxWidth = '460px';
  pairingBanner.style.background = 'rgba(5, 12, 20, 0.78)';
  pairingBanner.style.border = '1px solid rgba(125, 225, 255, 0.45)';
  pairingBanner.style.borderRadius = '12px';
  pairingBanner.style.fontFamily = 'Segoe UI, sans-serif';
  pairingBanner.style.fontSize = '13px';
  pairingBanner.style.color = '#ecf7ff';
  pairingBanner.style.zIndex = '2000';
  pairingBanner.style.backdropFilter = 'blur(4px)';
  pairingBanner.style.lineHeight = '1.4';

  const bannerContent = document.createElement('div');
  const qrCodeImage = document.createElement('img');
  qrCodeImage.alt = 'Phone controller QR code';
  qrCodeImage.width = 136;
  qrCodeImage.height = 136;
  qrCodeImage.style.display = 'block';
  qrCodeImage.style.borderRadius = '10px';
  qrCodeImage.style.background = '#ffffff';
  qrCodeImage.style.padding = '8px';
  qrCodeImage.style.marginTop = '10px';
  qrCodeImage.style.boxSizing = 'border-box';

  pairingBanner.appendChild(bannerContent);
  pairingBanner.appendChild(qrCodeImage);

  function getControllerUrl() {
    return `${controllerOrigin}/controller.html#${roomId}`;
  }

  async function updateQrCode() {
    try {
      qrCodeImage.src = await QRCode.toDataURL(getControllerUrl(), {
        margin: 1,
        width: 136,
        color: {
          dark: '#06121f',
          light: '#ffffff'
        }
      });
    } catch (error) {
      console.error('Failed to generate controller QR code', error);
      qrCodeImage.removeAttribute('src');
    }
  }

  async function resolveControllerOrigin() {
    const hostname = window.location.hostname;
    const looksLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!looksLocal) return;

    try {
      const response = await fetch('/controller-origin');
      if (!response.ok) return;

      const payload = await response.json();
      if (typeof payload.origin === 'string' && payload.origin.length > 0) {
        controllerOrigin = payload.origin;
      }
    } catch (error) {
      console.error('Failed to resolve LAN controller origin', error);
    }
  }

  function updateBanner(statusMessage) {
    bannerContent.innerHTML = [
      `<strong>Phone Controller</strong> — ${statusMessage}`,
      `Room: <strong>${roomId}</strong>`,
      `Controllers connected: ${remoteMotion.connectedControllers}`,
      `vertical: ${remoteMotion.vertical.toFixed(3)} | horizontal: ${remoteMotion.horizontal.toFixed(3)} | thrust: ${remoteMotion.motionIntensity.toFixed(2)}`,
      `<span style="font-size:11px;opacity:0.7">Scan the QR code on your phone, then accept the local HTTPS certificate warning once if the browser asks.</span>`
    ].join('<br>');
  }

  updateBanner('waiting');
  resolveControllerOrigin().finally(() => {
    updateQrCode();
  });
  document.body.appendChild(pairingBanner);

  let ws;
  try {
    ws = new WebSocket(wsUrl);
  } catch (error) {
    console.error('Failed to initialize controller relay socket', error);
    updateBanner('relay error');
  }

  if (ws) {
    ws.addEventListener('open', () => {
      updateBanner('relay connected');
    });

    ws.addEventListener('close', () => {
      updateBanner('relay disconnected');
    });

    ws.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'motion') {
          remoteMotion.targetVertical = Number(payload.pitch) || 0;
          remoteMotion.targetHorizontal = Number(payload.roll) || 0;
          remoteMotion.targetMotionIntensity = Number(payload.motionIntensity) || 0;

          if (payload.quaternion) {
            const { x, y, z, w } = payload.quaternion;
            remoteMotion.targetQuaternion.set(
              Number(x) || 0,
              Number(y) || 0,
              Number(z) || 0,
              Number(w) || 1
            ).normalize();
            remoteMotion.hasQuaternion = true;
          }

          updateBanner('motion active');
        }

        if (payload.type === 'calibrate') {
          remoteMotion.vertical = 0;
          remoteMotion.horizontal = 0;
          remoteMotion.targetVertical = 0;
          remoteMotion.targetHorizontal = 0;
          remoteMotion.motionIntensity = 0;
          remoteMotion.targetMotionIntensity = 0;
          remoteMotion.targetQuaternion.identity();
          remoteMotion.hasQuaternion = false;

          if (ship) {
            ship.quaternion.copy(shipBaseQuaternion);
          }

          updateBanner('recalibrated');
        }

        if (payload.type === 'paired' && typeof payload.controllerCount === 'number') {
          remoteMotion.connectedControllers = payload.controllerCount;
          updateBanner('paired');
        }

        if (payload.type === 'controller_count') {
          remoteMotion.connectedControllers = Number(payload.count) || 0;
          updateBanner('paired');
        }
      } catch (error) {
        console.error('Invalid relay payload', error);
      }
    });
  }

  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();

  function moveOnScreenAxes(horizontal, vertical) {
    if (horizontal === 0 && vertical === 0) return;

    cameraRight.setFromMatrixColumn(camera.matrix, 0).normalize();
    cameraUp.setFromMatrixColumn(camera.matrix, 1).normalize();

    camera.position.addScaledVector(cameraRight, horizontal);
    camera.position.addScaledVector(cameraUp, vertical);
    ChangedShipPos();
  }

  function applyRemoteMotionMovement() {
    remoteMotion.vertical += (remoteMotion.targetVertical - remoteMotion.vertical) * remoteMotion.smoothing;
    remoteMotion.horizontal += (remoteMotion.targetHorizontal - remoteMotion.horizontal) * remoteMotion.smoothing;
    remoteMotion.motionIntensity += (remoteMotion.targetMotionIntensity - remoteMotion.motionIntensity) * remoteMotion.speedSmoothing;

    if (ship && remoteMotion.hasQuaternion) {
      shipRelativeQuaternion.copy(remoteMotion.targetQuaternion).invert();
      shipTargetQuaternion.copy(shipBaseQuaternion).multiply(shipRelativeQuaternion);

      // Blend toward target, then cap per-frame angular change to suppress sudden spikes.
      shipBlendedQuaternion.copy(ship.quaternion).slerp(shipTargetQuaternion, remoteMotion.rotationSmoothing);
      ship.quaternion.rotateTowards(shipBlendedQuaternion, remoteMotion.maxRotationStepRadians);
    }

    const speedMultiplier = THREE.MathUtils.lerp(
      remoteMotion.minSpeedMultiplier,
      remoteMotion.maxSpeedMultiplier,
      remoteMotion.motionIntensity
    );
    const dynamicSpeed = remoteMotion.speed * speedMultiplier;

    moveOnScreenAxes(
      -remoteMotion.horizontal * dynamicSpeed,
      -remoteMotion.vertical * dynamicSpeed
    );
  }

    controls.addEventListener('change', () => {
      ChangedShipPos();
    });

  document.addEventListener('click', async () => {
    controls.lock();
  });

  const keys = {
    w: false,
    a: false,
    s: false,
    d: false
  };

  document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
  });

  document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
    if(e.key === "+")
    {
      starMaterialUniforms.speed.value+=.1;
    }
    if(e.key === "-")
    {
      starMaterialUniforms.speed.value-=.1;

    }
    if(e.key === "p")
    {
      starMaterialUniforms.speed.value = 0.1;
    }
    if(e.key==="o")
    {
      starMaterialUniforms.speed.value = 0.0;
    }
  });

  const speed = 0.1;

  function update() {
    applyRemoteMotionMovement();

    if (controls.isLocked) {
      if (keys.w) 
        {controls.moveForward(speed);ChangedShipPos();}
      if (keys.s){ controls.moveForward(-speed);ChangedShipPos();}
      if (keys.a){ controls.moveRight(-speed);ChangedShipPos();}
      if (keys.d){ controls.moveRight(speed);;ChangedShipPos();}
    }
  }

  return { controls, update };
}