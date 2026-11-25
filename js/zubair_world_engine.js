/**
 * ZUBAIR WORLD — Interactive 3D Physics Developer Portfolio Engine
 * Inspired by Bruno Simon's 3D Interactive Portfolio Experience
 * Powered by Three.js & Cannon.js Physics Simulation
 * Shaikh Abdul Zubair — Systems & Software Engineer
 */

(function () {
  'use strict';

  // --- Master Engine State ---
  const ZubairWorld = {
    // Core Graphics
    canvas: null,
    renderer: null,
    scene: null,
    camera: null,
    clock: null,
    cameraMode: 'chase', // 'chase', 'top', 'orbit'

    // Physics (Cannon.js)
    world: null,
    vehicle: null,
    chassisBody: null,
    wheelBodies: [],
    wheelMeshes: [],
    groundBody: null,

    // Visual Objects
    carMesh: null,
    headlights: [],
    taillights: [],
    projectWaypoints: [],
    interactiveObjects: [],
    zones: [],

    // Inputs & Control State
    inputs: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      handbrake: false,
      boost: false
    },

    // Vehicle Parameters
    maxSteerVal: 0.55,
    maxForce: 2800,
    brakeForce: 45,
    isModalOpen: false,
    activeWaypoint: null,

    // Audio Engine
    audioCtx: null,
    engineOsc: null,
    engineGain: null,
    audioMuted: true,

    // Quality Settings
    quality: 'high',
    isLoaded: false
  };

  // --- 1. Initialize Scene & Physics ---
  ZubairWorld.init = function () {
    ZubairWorld.canvas = document.getElementById('webgl-highway');
    if (!ZubairWorld.canvas) return;

    ZubairWorld.clock = new THREE.Clock();

    // Scene & Atmosphere
    ZubairWorld.scene = new THREE.Scene();
    ZubairWorld.scene.background = new THREE.Color(0x0A0A0C);
    ZubairWorld.scene.fog = new THREE.FogExp2(0x0A0A0C, 0.0035);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    ZubairWorld.camera = new THREE.PerspectiveCamera(52, aspect, 0.2, 2500);
    ZubairWorld.camera.position.set(0, 8, 16);

    // WebGL Renderer
    ZubairWorld.renderer = new THREE.WebGLRenderer({
      canvas: ZubairWorld.canvas,
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'high-performance'
    });
    ZubairWorld.renderer.setSize(window.innerWidth, window.innerHeight);
    ZubairWorld.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ZubairWorld.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    ZubairWorld.renderer.toneMappingExposure = 1.1;
    ZubairWorld.renderer.shadowMap.enabled = true;
    ZubairWorld.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize Cannon.js Physics
    initPhysics();

    // Initialize Lighting
    initLighting();

    // Build World Terrain & Road Network
    buildWorldEnvironment();

    // Build the 7 Exploration Zones & Project Billboards
    buildWorldZones();

    // Setup 3D Vehicle Physics
    buildPhysicsVehicle();

    // Setup User Controls (Desktop Keyboard + Mobile Virtual HUD)
    setupControls();

    // Setup Web Audio Synthesizer
    initAudioEngine();

    // Window Resize & Interaction Events
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', handleKeyInteractions, false);

    // Dismiss Loader
    dismissLoader();

    // Start 60fps Physics & Render Loop
    animate();
  };

  // --- 2. Cannon.js Physics Setup ---
  function initPhysics() {
    if (typeof CANNON === 'undefined') {
      console.error('Cannon.js not loaded!');
      return;
    }

    ZubairWorld.world = new CANNON.World();
    ZubairWorld.world.gravity.set(0, -18.8, 0);
    ZubairWorld.world.broadphase = new CANNON.SAPBroadphase(ZubairWorld.world);
    ZubairWorld.world.defaultContactMaterial.friction = 0.45;
    ZubairWorld.world.defaultContactMaterial.restitution = 0.05;

    // Infinite Ground Plane with Contact Material
    const groundMat = new CANNON.Material('ground');
    const groundShape = new CANNON.Plane();
    ZubairWorld.groundBody = new CANNON.Body({ mass: 0, material: groundMat });
    ZubairWorld.groundBody.addShape(groundShape);
    ZubairWorld.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    ZubairWorld.world.addBody(ZubairWorld.groundBody);
  }

  // --- 3. Lighting Architecture ---
  function initLighting() {
    const hemiLight = new THREE.HemisphereLight(0x9da3aa, 0x17191e, 0.75);
    hemiLight.position.set(0, 150, 0);
    ZubairWorld.scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xf2f0ea, 1.2);
    sun.position.set(80, 160, 90);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 450;
    const d = 110;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0004;
    ZubairWorld.scene.add(sun);
    ZubairWorld.sun = sun;
  }

  // --- 4. World Environment, Terrain & Roads ---
  function buildWorldEnvironment() {
    // Ground Plane with grid asphalt texture
    const groundGeo = new THREE.PlaneGeometry(800, 800, 64, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.85,
      metalness: 0.15
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    ZubairWorld.scene.add(groundMesh);

    // Multi-tier Road Network
    buildRoadPavements();

    // Surrounding Mountain Horizon & Neon Distant Skyscrapers
    buildHorizonProps();
  }

  function buildRoadPavements() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.7, metalness: 0.2 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xc5a46d, roughness: 0.5 }); // Gold/Bronze accent curbs

    // Main Central Avenue (Z axis: 50 to -400)
    const mainAvenue = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 450), roadMat);
    mainAvenue.position.set(0, 0.05, -175);
    mainAvenue.receiveShadow = true;
    ZubairWorld.scene.add(mainAvenue);

    // Left Crossway to Android City & AI Lab
    const crossway1 = new THREE.Mesh(new THREE.BoxGeometry(220, 0.1, 16), roadMat);
    crossway1.position.set(-60, 0.05, -120);
    crossway1.receiveShadow = true;
    ZubairWorld.scene.add(crossway1);

    // Right Crossway to Gaming Realm & Web Metro
    const crossway2 = new THREE.Mesh(new THREE.BoxGeometry(220, 0.1, 16), roadMat);
    crossway2.position.set(60, 0.05, -260);
    crossway2.receiveShadow = true;
    ZubairWorld.scene.add(crossway2);

    // Curbs and Boundary Physics Colliders
    addPhysicsWall(-8, 0.6, -175, 0.4, 1.2, 450); // West boundary
    addPhysicsWall(8, 0.6, -175, 0.4, 1.2, 450);  // East boundary
  }

  function addPhysicsWall(x, y, z, wx, wy, wz) {
    if (!ZubairWorld.world) return;
    const shape = new CANNON.Box(new CANNON.Vec3(wx / 2, wy / 2, wz / 2));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(x, y, z);
    ZubairWorld.world.addBody(body);
  }

  function buildHorizonProps() {
    // Distant architectural towers
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x13161c, roughness: 0.9, metalness: 0.1 });
    const neonGlowMat = new THREE.MeshBasicMaterial({ color: 0xc5a46d });

    for (let i = 0; i < 35; i++) {
      const h = 40 + Math.random() * 80;
      const w = 15 + Math.random() * 25;
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), bldgMat);
      const angle = (i / 35) * Math.PI * 2;
      const rad = 280 + Math.random() * 80;
      bldg.position.set(Math.cos(angle) * rad, h / 2, Math.sin(angle) * rad);
      bldg.castShadow = true;
      ZubairWorld.scene.add(bldg);

      // Neon roof accent line
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 1.5, w * 0.9), neonGlowMat);
      roof.position.set(bldg.position.x, h, bldg.position.z);
      ZubairWorld.scene.add(roof);
    }
  }

  // --- 5. The 7 World Zones & Interactive Project Waypoints ---
  function buildWorldZones() {
    const rawProjects = window.allProjects || [];

    const zoneDefs = [
      { id: 'garage', name: 'Zone 1: Home Garage', pos: [0, 0, 20], color: 0xc5a46d, tag: 'STARTING GARAGE' },
      { id: 'android', name: 'Zone 2: Android City', pos: [-75, 0, -120], color: 0x3DDC84, tag: 'ANDROID APPS & MESH' },
      { id: 'ai', name: 'Zone 3: AI Research Lab', pos: [-85, 0, -280], color: 0x3478F6, tag: 'AUTONOMOUS AI & LLMs' },
      { id: 'gaming', name: 'Zone 4: Gaming Realm', pos: [75, 0, -120], color: 0xE50914, tag: 'GAME ENGINES & RTS' },
      { id: 'web', name: 'Zone 5: Web Dev City', pos: [75, 0, -260], color: 0x10B981, tag: 'CLOUD & WEB PLATFORMS' },
      { id: 'software', name: 'Zone 6: Software Workshop', pos: [0, 0, -320], color: 0x9DA3AA, tag: 'SYSTEMS & UTILITIES' },
      { id: 'destination', name: 'Zone 7: Sunset Overlook', pos: [0, 0, -400], color: 0xC5A46D, tag: 'FINAL DESTINATION & RESUME' }
    ];

    zoneDefs.forEach(z => {
      buildZoneLandmark(z);
    });

    // Populate Real 69 Project Interactive Waypoints with actual screenshots!
    const keyProjects = [
      { id: 'nexus-meshlink-offline', zone: 'android', pos: [-65, 0, -110], name: 'Nexus (MeshLink & PocketAI)' },
      { id: 'nearmeshchat-sahay-android', zone: 'android', pos: [-85, 0, -110], name: 'NearMeshChat (Sahay Disaster)' },
      { id: 'cyclecare-health-platform', zone: 'android', pos: [-65, 0, -135], name: 'CycleCare Health Platform' },
      { id: 'interact-app', zone: 'android', pos: [-85, 0, -135], name: 'Interakt Collaboration App' },
      { id: 'aura-autonomous-ai-system', zone: 'ai', pos: [-75, 0, -265], name: 'AURA Autonomous AI System' },
      { id: 'ai-hardware-assistant-arduino', zone: 'ai', pos: [-95, 0, -265], name: 'AI Hardware Assistant (Arduino)' },
      { id: 'ai-zubair-llm-research', zone: 'ai', pos: [-75, 0, -295], name: 'Zubair LLM Research (Llama)' },
      { id: 'draw-your-army-warforge', zone: 'gaming', pos: [65, 0, -110], name: 'WarForge: Draw Your Army (Unity RTS)' },
      { id: 'evergreen-after-the-fall-godot-rpg', zone: 'gaming', pos: [85, 0, -110], name: 'Evergreen: After The Fall (Godot 4)' },
      { id: 'minecraft-3d-voxel-engine', zone: 'gaming', pos: [65, 0, -135], name: 'Minecraft 3D Voxel Engine' },
      { id: 'srk-campus-connect', zone: 'web', pos: [65, 0, -245], name: 'SRK Campus Connect (3 Flutter Apps)' },
      { id: 'masipay-canteen', zone: 'web', pos: [85, 0, -245], name: 'MasiPay / MasiCanteen (Vercel Live)' },
      { id: 'projectflow-intelligence', zone: 'web', pos: [65, 0, -275], name: 'ProjectFlow Intelligence (Render Cloud)' },
      { id: 'systems-and-algorithms-cpp', zone: 'software', pos: [-12, 0, -320], name: 'Systems & Algorithms C++ Core' },
      { id: 'visual-studio-node-console', zone: 'software', pos: [12, 0, -320], name: 'Visual Studio Node.js CLI Service' }
    ];

    keyProjects.forEach(kp => {
      buildInteractiveBillboard(kp);
    });
  }

  function buildZoneLandmark(z) {
    const group = new THREE.Group();
    group.position.set(z.pos[0], z.pos[1], z.pos[2]);

    // Landmark base ring
    const ringGeo = new THREE.RingGeometry(8, 9, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: z.color, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.08;
    group.add(ring);

    // Glowing Zone Beacon Cylinder
    const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 18, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: 0.65 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 9;
    group.add(beacon);

    // PointLight illumination
    const pLight = new THREE.PointLight(z.color, 1.8, 35);
    pLight.position.y = 6;
    group.add(pLight);

    ZubairWorld.scene.add(group);
  }

  function buildInteractiveBillboard(kp) {
    const group = new THREE.Group();
    group.position.set(kp.pos[0], kp.pos[1], kp.pos[2]);

    // 3D Billboard Stand
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f232b, metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 7, 12), poleMat);
    pole.position.y = 3.5;
    pole.castShadow = true;
    group.add(pole);

    // High-Resolution Screenshot Texture Screen
    const screenGeo = new THREE.PlaneGeometry(9, 5.2);
    const textureLoader = new THREE.TextureLoader();
    const screenshotUrl = 'images/screenshots/' + kp.id + '.png';

    textureLoader.load(screenshotUrl, function (tex) {
      tex.generateMipmaps = true;
      const screenMat = new THREE.MeshBasicMaterial({ map: tex });
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.y = 7.5;
      screenMesh.castShadow = true;
      group.add(screenMesh);
    }, undefined, function () {
      // Fallback screen
      const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x1a202c });
      const fallbackMesh = new THREE.Mesh(screenGeo, fallbackMat);
      fallbackMesh.position.y = 7.5;
      group.add(fallbackMesh);
    });

    // Frame
    const frameGeo = new THREE.BoxGeometry(9.4, 5.6, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, metalness: 0.9, roughness: 0.2 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 7.5;
    frame.castShadow = true;
    group.add(frame);

    // Physical Collider around billboard pole
    addPhysicsWall(kp.pos[0], 3.5, kp.pos[2], 2.2, 7, 2.2);

    // Store interaction data
    group.userData = {
      projectId: kp.id,
      name: kp.name,
      pos: kp.pos,
      radius: 8.5
    };

    ZubairWorld.interactiveObjects.push(group);
    ZubairWorld.scene.add(group);
  }

  // --- 6. 3D Physics Vehicle (RaycastVehicle Simulation) ---
  function buildPhysicsVehicle() {
    if (!ZubairWorld.world) return;

    // Chassis Physics Body (Mass = 1450 kg)
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.1, 0.5, 2.3));
    ZubairWorld.chassisBody = new CANNON.Body({ mass: 1450 });
    ZubairWorld.chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.6, 0));
    ZubairWorld.chassisBody.position.set(0, 1.8, 15); // Start at Home Garage
    ZubairWorld.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI); // Face forward (South)
    ZubairWorld.world.addBody(ZubairWorld.chassisBody);

    // RaycastVehicle setup
    ZubairWorld.vehicle = new CANNON.RaycastVehicle({
      chassisBody: ZubairWorld.chassisBody,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2
    });

    // Realistic suspension & drift friction options
    const wheelOptions = {
      radius: 0.4,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 42,
      suspensionRestLength: 0.42,
      frictionSlip: 3.2,
      dampingRelaxation: 2.5,
      dampingCompression: 4.2,
      maxSuspensionForce: 100000,
      rollInfluence: 0.12,
      axleLocal: new CANNON.Vec3(-1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3()
    };

    // 4 Wheels positioning
    const xOff = 1.15;
    const yOff = 0.25;
    const zOff = 1.45;

    // Front Left (0)
    wheelOptions.chassisConnectionPointLocal.set(-xOff, yOff, -zOff);
    ZubairWorld.vehicle.addWheel(wheelOptions);

    // Front Right (1)
    wheelOptions.chassisConnectionPointLocal.set(xOff, yOff, -zOff);
    ZubairWorld.vehicle.addWheel(wheelOptions);

    // Rear Left (2)
    wheelOptions.chassisConnectionPointLocal.set(-xOff, yOff, zOff);
    ZubairWorld.vehicle.addWheel(wheelOptions);

    // Rear Right (3)
    wheelOptions.chassisConnectionPointLocal.set(xOff, yOff, zOff);
    ZubairWorld.vehicle.addWheel(wheelOptions);

    ZubairWorld.vehicle.addToWorld(ZubairWorld.world);

    // Build Three.js Visual Car
    loadVisualCar();
  }

  function loadVisualCar() {
    const loader = new THREE.GLTFLoader();
    loader.load(
      'models/sports_car.glb',
      function (gltf) {
        const model = gltf.scene;

        // Custom Paint: Metallic Obsidian / Crimson Red Trim
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0xD30F15,
          metalness: 0.9,
          roughness: 0.16
        });

        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('main')) {
              child.material = bodyMat;
            }
          }
        });

        model.scale.set(1.4, 1.4, 1.4);

        // Headlights
        const leftLight = new THREE.SpotLight(0xffffff, 4.0, 75, Math.PI / 6, 0.45);
        leftLight.position.set(-0.75, 0.6, -2.0);
        leftLight.target.position.set(-0.75, 0, -25);
        model.add(leftLight);
        model.add(leftLight.target);

        const rightLight = new THREE.SpotLight(0xffffff, 4.0, 75, Math.PI / 6, 0.45);
        rightLight.position.set(0.75, 0.6, -2.0);
        rightLight.target.position.set(0.75, 0, -25);
        model.add(rightLight);
        model.add(rightLight.target);

        ZubairWorld.carMesh = model;
        ZubairWorld.scene.add(model);
      },
      undefined,
      function () {
        // Procedural Supercar Fallback
        buildFallbackCar();
      }
    );
  }

  function buildFallbackCar() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xE50914, metalness: 0.85, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 4.4), bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.2), new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.1 }));
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    ZubairWorld.carMesh = group;
    ZubairWorld.scene.add(group);
  }

  // --- 7. Desktop Keyboard & Mobile Touch Controls ---
  function setupControls() {
    // Keyboard listeners
    window.addEventListener('keydown', (e) => {
      if (ZubairWorld.isModalOpen) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          ZubairWorld.inputs.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          ZubairWorld.inputs.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          ZubairWorld.inputs.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          ZubairWorld.inputs.right = true;
          break;
        case 'Space':
          ZubairWorld.inputs.handbrake = true;
          e.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          ZubairWorld.inputs.boost = true;
          break;
        case 'KeyR':
          resetVehicle();
          break;
        case 'KeyC':
          toggleCamera();
          break;
        case 'KeyE':
          triggerActiveInteraction();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          ZubairWorld.inputs.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          ZubairWorld.inputs.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          ZubairWorld.inputs.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          ZubairWorld.inputs.right = false;
          break;
        case 'Space':
          ZubairWorld.inputs.handbrake = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          ZubairWorld.inputs.boost = false;
          break;
      }
    });

    // Mobile Virtual Touch Buttons Setup
    setupMobileTouchHUD();
  }

  function setupMobileTouchHUD() {
    const bindTouch = (elemId, keyProp) => {
      const el = document.getElementById(elemId);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        ZubairWorld.inputs[keyProp] = true;
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        ZubairWorld.inputs[keyProp] = false;
      });
    };

    bindTouch('mobile-btn-gas', 'forward');
    bindTouch('mobile-btn-brake', 'backward');
    bindTouch('mobile-btn-left', 'left');
    bindTouch('mobile-btn-right', 'right');
    bindTouch('mobile-btn-handbrake', 'handbrake');

    const resetBtn = document.getElementById('mobile-btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetVehicle);

    const camBtn = document.getElementById('mobile-btn-cam');
    if (camBtn) camBtn.addEventListener('click', toggleCamera);
  }

  function resetVehicle() {
    if (!ZubairWorld.chassisBody) return;
    ZubairWorld.chassisBody.velocity.set(0, 0, 0);
    ZubairWorld.chassisBody.angularVelocity.set(0, 0, 0);
    ZubairWorld.chassisBody.position.y += 1.8;
    ZubairWorld.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
  }

  function toggleCamera() {
    const modes = ['chase', 'top', 'orbit'];
    const idx = (modes.indexOf(ZubairWorld.cameraMode) + 1) % modes.length;
    ZubairWorld.cameraMode = modes[idx];
    const modeEl = document.getElementById('hud-camera-mode');
    if (modeEl) modeEl.textContent = ZubairWorld.cameraMode.toUpperCase();
  }

  function handleKeyInteractions(e) {
    if (e.code === 'KeyE') {
      triggerActiveInteraction();
    }
  }

  function triggerActiveInteraction() {
    if (ZubairWorld.activeWaypoint && typeof window.openScreenshotModal === 'function') {
      window.openScreenshotModal(ZubairWorld.activeWaypoint.userData.projectId);
    }
  }

  // --- 8. Web Audio Engine (Realistic Engine Sound Synthesis) ---
  function initAudioEngine() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ZubairWorld.audioCtx = new AudioCtx();

      // Dual Oscillator for rich automotive exhaust harmonics
      ZubairWorld.engineOsc = ZubairWorld.audioCtx.createOscillator();
      ZubairWorld.engineOsc.type = 'sawtooth';
      ZubairWorld.engineOsc.frequency.setValueAtTime(45, ZubairWorld.audioCtx.currentTime);

      ZubairWorld.engineGain = ZubairWorld.audioCtx.createGain();
      ZubairWorld.engineGain.gain.setValueAtTime(0, ZubairWorld.audioCtx.currentTime); // Muted by default

      ZubairWorld.engineOsc.connect(ZubairWorld.engineGain);
      ZubairWorld.engineGain.connect(ZubairWorld.audioCtx.destination);
      ZubairWorld.engineOsc.start();
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  window.toggleZubairAudio = function () {
    ZubairWorld.audioMuted = !ZubairWorld.audioMuted;
    if (ZubairWorld.audioCtx && ZubairWorld.audioCtx.state === 'suspended') {
      ZubairWorld.audioCtx.resume();
    }
    if (ZubairWorld.engineGain && ZubairWorld.audioCtx) {
      ZubairWorld.engineGain.gain.setValueAtTime(ZubairWorld.audioMuted ? 0 : 0.08, ZubairWorld.audioCtx.currentTime);
    }
    const icon = document.getElementById('btn-sound-toggle');
    if (icon) icon.textContent = ZubairWorld.audioMuted ? '🔇 Audio Off' : '🔊 Audio On';
  };

  // --- 9. Physics Step & Vehicle Dynamics ---
  function updateVehiclePhysics(dt) {
    const v = ZubairWorld.vehicle;
    if (!v) return;

    // Engine Force (All-Wheel Acceleration)
    let engineForce = 0;
    if (ZubairWorld.inputs.forward) {
      engineForce = -ZubairWorld.maxForce * (ZubairWorld.inputs.boost ? 1.6 : 1.0);
    } else if (ZubairWorld.inputs.backward) {
      engineForce = ZubairWorld.maxForce * 0.65;
    }

    // Steering
    let steer = 0;
    if (ZubairWorld.inputs.left) steer = ZubairWorld.maxSteerVal;
    if (ZubairWorld.inputs.right) steer = -ZubairWorld.maxSteerVal;

    // Apply to wheels
    v.applyEngineForce(engineForce, 2);
    v.applyEngineForce(engineForce, 3);

    v.setSteeringValue(steer, 0);
    v.setSteeringValue(steer, 1);

    // Handbrake
    const brake = ZubairWorld.inputs.handbrake ? ZubairWorld.brakeForce : 0;
    v.setBrake(brake, 0);
    v.setBrake(brake, 1);
    v.setBrake(brake * 1.5, 2);
    v.setBrake(brake * 1.5, 3);

    // Audio frequency update based on speed
    if (ZubairWorld.engineOsc && ZubairWorld.audioCtx && !ZubairWorld.audioMuted) {
      const speed = Math.abs(ZubairWorld.chassisBody.velocity.length());
      const targetFreq = 42 + Math.min(180, speed * 7.5);
      ZubairWorld.engineOsc.frequency.setTargetAtTime(targetFreq, ZubairWorld.audioCtx.currentTime, 0.1);
    }

    // Update Telemetry HUD
    updateTelemetryHUD();

    // Check Proximity to Interactive 3D Projects
    checkProjectProximity();
  }

  function updateTelemetryHUD() {
    if (!ZubairWorld.chassisBody) return;
    const speedKmh = Math.round(ZubairWorld.chassisBody.velocity.length() * 3.6);
    const speedEl = document.getElementById('hud-speed-value');
    if (speedEl) speedEl.textContent = speedKmh;

    // Position coordinates
    const pos = ZubairWorld.chassisBody.position;
    const coordEl = document.getElementById('hud-coords-value');
    if (coordEl) {
      coordEl.textContent = `X:${Math.round(pos.x)} Z:${Math.round(pos.z)}`;
    }
  }

  function checkProjectProximity() {
    if (!ZubairWorld.chassisBody) return;
    const carPos = ZubairWorld.chassisBody.position;
    let closestObj = null;
    let minDistance = 999;

    for (let obj of ZubairWorld.interactiveObjects) {
      const p = obj.userData.pos;
      const dx = carPos.x - p[0];
      const dz = carPos.z - p[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < obj.userData.radius && dist < minDistance) {
        minDistance = dist;
        closestObj = obj;
      }
    }

    ZubairWorld.activeWaypoint = closestObj;

    const promptEl = document.getElementById('interaction-prompt-hud');
    if (promptEl) {
      if (closestObj) {
        promptEl.innerHTML = `<span style="color:#C5A46D;">[E]</span> INTERACT WITH <strong style="color:#fff;">${closestObj.userData.name}</strong>`;
        promptEl.classList.add('visible');
      } else {
        promptEl.classList.remove('visible');
      }
    }
  }

  // --- 10. Camera Modes & Chase Choreography ---
  function updateCamera() {
    if (!ZubairWorld.chassisBody || !ZubairWorld.camera) return;
    const carPos = ZubairWorld.chassisBody.position;
    const carQuat = ZubairWorld.chassisBody.quaternion;

    const threePos = new THREE.Vector3(carPos.x, carPos.y, carPos.z);
    const threeQuat = new THREE.Quaternion(carQuat.x, carQuat.y, carQuat.z, carQuat.w);

    if (ZubairWorld.cameraMode === 'chase') {
      // Behind car offset
      const offset = new THREE.Vector3(0, 3.4, 8.2).applyQuaternion(threeQuat);
      const targetCamPos = threePos.clone().add(offset);
      ZubairWorld.camera.position.lerp(targetCamPos, 0.12);

      // Look slightly above hood
      const lookTarget = threePos.clone().add(new THREE.Vector3(0, 1.2, 0));
      ZubairWorld.camera.lookAt(lookTarget);
    } else if (ZubairWorld.cameraMode === 'top') {
      // Helicopter / Top-Down View
      const targetCamPos = threePos.clone().add(new THREE.Vector3(0, 24, 6));
      ZubairWorld.camera.position.lerp(targetCamPos, 0.08);
      ZubairWorld.camera.lookAt(threePos);
    }
  }

  // --- 11. 60FPS Render Loop ---
  function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(ZubairWorld.clock.getDelta(), 0.1);

    if (ZubairWorld.world && !ZubairWorld.isModalOpen) {
      // Step Cannon Physics
      ZubairWorld.world.step(1 / 60, dt, 3);

      // Update Vehicle Physics
      updateVehiclePhysics(dt);

      // Sync Visual Three.js Car to Physics Chassis
      if (ZubairWorld.carMesh && ZubairWorld.chassisBody) {
        ZubairWorld.carMesh.position.copy(ZubairWorld.chassisBody.position);
        ZubairWorld.carMesh.quaternion.copy(ZubairWorld.chassisBody.quaternion);
      }
    }

    // Update Camera
    updateCamera();

    // Render Scene
    if (ZubairWorld.renderer && ZubairWorld.scene && ZubairWorld.camera) {
      ZubairWorld.renderer.render(ZubairWorld.scene, ZubairWorld.camera);
    }
  }

  function onWindowResize() {
    if (!ZubairWorld.camera || !ZubairWorld.renderer) return;
    ZubairWorld.camera.aspect = window.innerWidth / window.innerHeight;
    ZubairWorld.camera.updateProjectionMatrix();
    ZubairWorld.renderer.setSize(window.innerWidth, window.innerHeight);
    ZubairWorld.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function dismissLoader() {
    const loader = document.getElementById('cinematic-loader');
    if (loader) {
      loader.classList.add('loaded');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 600);
    }
  }

  // Expose to window
  window.ZubairWorld = ZubairWorld;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ZubairWorld.init);
  } else {
    ZubairWorld.init();
  }
})();
