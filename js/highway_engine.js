/**
 * ZUBAIR'S DIGITAL HIGHWAY — Core 3D Cinematic Driving Engine
 * Architected with Three.js, GSAP ScrollTrigger & Lenis
 * Shaikh Abdul Zubair — Systems & Software Engineer
 */

(function () {
  'use strict';

  // --- Global State & Configuration ---
  const HighwayEngine = {
    canvas: null,
    renderer: null,
    scene: null,
    camera: null,
    clock: null,
    spline: null,
    car: null,
    wheels: [],
    headlights: [],
    taillights: [],
    roadMesh: null,
    roadLines: null,
    billboards: [],
    sceneMarkers: [],
    progress: 0,
    targetProgress: 0,
    speed: 0,
    quality: 'high',
    isLoaded: false,
    audioEnabled: false,
    carSpeed: 0,
    lastScrollTime: Date.now(),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),

    // Scene Environment Themes
    themes: [
      { t: 0.0, name: "Midnight Highway", fog: 0x05070c, light: 0x4466aa, ground: 0x07090f },
      { t: 0.15, name: "Systems Landscape", fog: 0x080a12, light: 0x5577bb, ground: 0x0a0c16 },
      { t: 0.35, name: "Android Cyber City", fog: 0x0e0618, light: 0x3DDC84, ground: 0x120820 },
      { t: 0.55, name: "AI Technology Zone", fog: 0x030d1a, light: 0x00d2ff, ground: 0x041122 },
      { t: 0.72, name: "Gaming Realm", fog: 0x140a06, light: 0xff4422, ground: 0x180d08 },
      { t: 0.88, name: "Enterprise Metro", fog: 0x080e18, light: 0x2288ff, ground: 0x0a121e },
      { t: 1.0, name: "Sunset Horizon", fog: 0x1c0b08, light: 0xff6622, ground: 0x240f0a }
    ]
  };

  // --- 1. Spline Curve Creation ---
  function createHighwaySpline() {
    // 3D smooth winding highway path
    const points = [
      new THREE.Vector3(0, 0, 0),         // Hero Start
      new THREE.Vector3(15, 0, -120),
      new THREE.Vector3(-25, 2, -260),
      new THREE.Vector3(-40, 5, -420),    // About
      new THREE.Vector3(0, 6, -580),
      new THREE.Vector3(50, 4, -750),     // Android City Entrance
      new THREE.Vector3(70, 0, -920),     // Android City Core
      new THREE.Vector3(30, 0, -1100),
      new THREE.Vector3(-20, -2, -1280),  // AI Research Tunnel
      new THREE.Vector3(-50, -2, -1460),  // AI Core
      new THREE.Vector3(-10, 3, -1650),
      new THREE.Vector3(40, 8, -1840),    // Gaming Mountain Pass
      new THREE.Vector3(60, 12, -2020),   // Gaming Citadel
      new THREE.Vector3(10, 6, -2200),
      new THREE.Vector3(-30, 2, -2380),   // Web & Enterprise Metro
      new THREE.Vector3(0, 0, -2560),
      new THREE.Vector3(25, 0, -2740),    // Golden Sunset Overlook
      new THREE.Vector3(0, 0, -2900)      // Final Destination Stop
    ];

    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.25);
  }

  // --- 2. Initialize Three.js Scene ---
  HighwayEngine.init = function () {
    HighwayEngine.canvas = document.getElementById('webgl-highway');
    if (!HighwayEngine.canvas) return;

    HighwayEngine.clock = new THREE.Clock();
    HighwayEngine.spline = createHighwaySpline();

    // Scene & Fog
    HighwayEngine.scene = new THREE.Scene();
    HighwayEngine.scene.fog = new THREE.FogExp2(0x05070c, 0.0028);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    HighwayEngine.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 3500);
    HighwayEngine.camera.position.set(0, 3.2, 8);

    // Renderer
    HighwayEngine.renderer = new THREE.WebGLRenderer({
      canvas: HighwayEngine.canvas,
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'high-performance',
      alpha: false
    });
    HighwayEngine.renderer.setSize(window.innerWidth, window.innerHeight);
    HighwayEngine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    HighwayEngine.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    HighwayEngine.renderer.toneMappingExposure = 1.15;
    HighwayEngine.renderer.shadowMap.enabled = true;
    HighwayEngine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    buildLighting();

    // Environment & Highway
    buildHighwayRoad();
    buildSurroundingTerrain();
    buildAtmosphericParticles();
    buildStreetlights();

    // Load Car Model
    loadSportsCar();

    // Setup Window Events & Raycasting
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onSceneClick, false);

    // Setup GSAP Scroll Connection
    setupScrollSync();

    // Start Animation Loop
    animate();
  };

  // --- 3. Lighting Architecture ---
  function buildLighting() {
    // Ambient soft hemisphere
    const hemiLight = new THREE.HemisphereLight(0x4466aa, 0x05070c, 0.6);
    hemiLight.position.set(0, 100, 0);
    HighwayEngine.scene.add(hemiLight);
    HighwayEngine.hemiLight = hemiLight;

    // Main moonlight / sky directional
    const dirLight = new THREE.DirectionalLight(0xaaccff, 0.85);
    dirLight.position.set(100, 150, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    const d = 60;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    HighwayEngine.scene.add(dirLight);
    HighwayEngine.dirLight = dirLight;
  }

  // --- 4. Procedural Ribbon Highway ---
  function buildHighwayRoad() {
    const curve = HighwayEngine.spline;
    const segments = 1200;
    const roadWidth = 9.0;
    const roadThickness = 0.4;

    const roadGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    // Roadside barriers & lines
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Left edge, center, right edge
      const pLeft = point.clone().addScaledVector(binormal, -roadWidth / 2);
      const pRight = point.clone().addScaledVector(binormal, roadWidth / 2);

      positions.push(pLeft.x, pLeft.y, pLeft.z);
      positions.push(pRight.x, pRight.y, pRight.z);

      uvs.push(0, t * 120);
      uvs.push(1, t * 120);

      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    // High quality asphalt shader material
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.65,
      metalness: 0.25
    });

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    HighwayEngine.scene.add(roadMesh);
    HighwayEngine.roadMesh = roadMesh;

    // Glowing Center Dashed Line
    buildCenterDashedLine();
  }

  function buildCenterDashedLine() {
    const curve = HighwayEngine.spline;
    const lineGeo = new THREE.BufferGeometry();
    const points = curve.getPoints(1400);
    lineGeo.setFromPoints(points);

    // White / Neon Cyan glowing centerline
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 3.5,
      gapSize: 4.0,
      linewidth: 2
    });

    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    line.position.y += 0.04;
    HighwayEngine.scene.add(line);
    HighwayEngine.roadLines = line;
  }

  // --- 5. Streetlights & City Lamp Architecture ---
  function buildStreetlights() {
    const curve = HighwayEngine.spline;
    const count = 48;
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x22252a, metalness: 0.8, roughness: 0.3 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa });

    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 8, 8);
    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 2.2);
    const lightHeadGeo = new THREE.SphereGeometry(0.35, 12, 12);

    for (let i = 0; i < count; i++) {
      const t = 0.05 + (i / count) * 0.92;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const side = (i % 2 === 0) ? 1 : -1;
      const polePos = pt.clone().addScaledVector(binormal, side * 5.8);

      const poleGroup = new THREE.Group();
      poleGroup.position.copy(polePos);

      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 4;
      pole.castShadow = true;
      poleGroup.add(pole);

      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(-side * 0.9, 7.8, 0);
      poleGroup.add(arm);

      const head = new THREE.Mesh(lightHeadGeo, lampGlowMat);
      head.position.set(-side * 1.8, 7.7, 0);
      poleGroup.add(head);

      // Local spotlight for realistic road pool of light
      if (i % 3 === 0) {
        const spot = new THREE.SpotLight(0xffea99, 1.2, 25, Math.PI / 4, 0.4);
        spot.position.copy(head.position);
        spot.target.position.set(-side * 1.8, 0, 0);
        poleGroup.add(spot);
        poleGroup.add(spot.target);
      }

      HighwayEngine.scene.add(poleGroup);
    }
  }

  // --- 6. Atmospheric Terrain, Mountains & Stars ---
  function buildSurroundingTerrain() {
    // Vast low-poly mountain horizon
    const mountainGeo = new THREE.ConeGeometry(80, 140, 6);
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x090b10,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    for (let i = 0; i < 45; i++) {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      const side = (Math.random() > 0.5) ? 1 : -1;
      const z = -Math.random() * 3000;
      const x = side * (120 + Math.random() * 350);
      const y = -10 + Math.random() * 40;
      const scale = 0.8 + Math.random() * 1.5;
      m.position.set(x, y, z);
      m.scale.set(scale, scale, scale);
      m.rotation.y = Math.random() * Math.PI;
      HighwayEngine.scene.add(m);
    }
  }

  function buildAtmosphericParticles() {
    // Floating cinematic cyber dust particles
    const count = 1200;
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const colors = [];

    for (let i = 0; i < count; i++) {
      pos.push(
        (Math.random() - 0.5) * 400,
        Math.random() * 80,
        -Math.random() * 3000
      );
      colors.push(0.6, 0.8, 1.0);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geo, mat);
    HighwayEngine.scene.add(particles);
    HighwayEngine.particles = particles;
  }

  // --- 7. Load & Setup 3D Sports Car ---
  function loadSportsCar() {
    const loader = new THREE.GLTFLoader();
    const modelUrl = 'models/sports_car.glb';

    loader.load(
      modelUrl,
      function (gltf) {
        const carModel = gltf.scene;

        // Realistic Automotive Paint: Deep Metallic Crimson Red
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0xD30F15,
          metalness: 0.9,
          roughness: 0.16,
          envMapIntensity: 1.5
        });

        // Wheel rubber material
        const tireMat = new THREE.MeshStandardMaterial({
          color: 0x18181c,
          roughness: 0.85,
          metalness: 0.1
        });

        // Glass material
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x111116,
          metalness: 0.1,
          roughness: 0.05,
          transmission: 0.85,
          transparent: true,
          opacity: 0.45
        });

        // Front Headlight Glow
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff1122 });

        carModel.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const name = child.name.toLowerCase();
            if (name.includes('body') || name.includes('main')) {
              child.material = bodyMat;
            } else if (name.includes('glass')) {
              child.material = glassMat;
            } else if (name.includes('tire')) {
              child.material = tireMat;
            } else if (name.includes('lights_red')) {
              child.material = redLightMat;
            } else if (name.includes('lights') || name.includes('leds')) {
              child.material = lightMat;
            }
          }

          // Register Wheel nodes for rotation & steering
          if (child.name.startsWith('wheel_')) {
            HighwayEngine.wheels.push(child);
          }
        });

        // Scale & Position
        carModel.scale.set(1.4, 1.4, 1.4);

        // Build Headlights SpotLights
        const leftHeadlight = new THREE.SpotLight(0xffffff, 4.5, 90, Math.PI / 7, 0.45, 1.2);
        leftHeadlight.position.set(-0.75, 0.65, -1.8);
        leftHeadlight.target.position.set(-0.75, 0, -35);
        carModel.add(leftHeadlight);
        carModel.add(leftHeadlight.target);

        const rightHeadlight = new THREE.SpotLight(0xffffff, 4.5, 90, Math.PI / 7, 0.45, 1.2);
        rightHeadlight.position.set(0.75, 0.65, -1.8);
        rightHeadlight.target.position.set(0.75, 0, -35);
        carModel.add(rightHeadlight);
        carModel.add(rightHeadlight.target);

        // Red Taillight Glow
        const tailGlow = new THREE.PointLight(0xff1122, 2.0, 15);
        tailGlow.position.set(0, 0.7, 2.2);
        carModel.add(tailGlow);

        HighwayEngine.car = carModel;
        HighwayEngine.scene.add(carModel);

        // Initial Placement
        updateCarPosition(0.001);

        HighwayEngine.isLoaded = true;
        dismissLoadingScreen();
      },
      function (xhr) {
        const percent = Math.min(100, Math.round((xhr.loaded / (xhr.total || 1700000)) * 100));
        updateLoadingProgress(percent);
      },
      function (error) {
        console.warn('GLTF Car failed to load, generating procedural concept supercar:', error);
        buildProceduralSupercar();
      }
    );
  }

  // --- 8. Procedural Fallback Supercar (Zero Downtime Guarantee) ---
  function buildProceduralSupercar() {
    const carGroup = new THREE.Group();

    // Aerodynamic Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xE50914,
      metalness: 0.9,
      roughness: 0.18
    });
    const cabinMat = new THREE.MeshPhysicalMaterial({
      color: 0x090a0d,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.8,
      transparent: true,
      opacity: 0.4
    });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.8 });

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 4.6), bodyMat);
    lowerBody.position.y = 0.55;
    lowerBody.castShadow = true;
    carGroup.add(lowerBody);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.3), cabinMat);
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.35, 18);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelPositions = [
      [-1.1, 0.38, -1.4], [1.1, 0.38, -1.4],
      [-1.1, 0.38, 1.4],  [1.1, 0.38, 1.4]
    ];

    wheelPositions.forEach((pos, idx) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.name = 'wheel_' + idx;
      w.position.set(pos[0], pos[1], pos[2]);
      w.castShadow = true;
      carGroup.add(w);
      HighwayEngine.wheels.push(w);
    });

    // Lights
    const headLeft = new THREE.SpotLight(0xffffff, 4.5, 80, Math.PI / 6, 0.5);
    headLeft.position.set(-0.7, 0.55, -2.3);
    headLeft.target.position.set(-0.7, 0, -30);
    carGroup.add(headLeft);
    carGroup.add(headLeft.target);

    const headRight = new THREE.SpotLight(0xffffff, 4.5, 80, Math.PI / 6, 0.5);
    headRight.position.set(0.7, 0.55, -2.3);
    headRight.target.position.set(0.7, 0, -30);
    carGroup.add(headRight);
    carGroup.add(headRight.target);

    HighwayEngine.car = carGroup;
    HighwayEngine.scene.add(carGroup);

    updateCarPosition(0.001);
    HighwayEngine.isLoaded = true;
    dismissLoadingScreen();
  }

  // --- 9. Highway Car Dynamics & Wheel Tracking ---
  function updateCarPosition(t) {
    if (!HighwayEngine.car || !HighwayEngine.spline) return;

    const clampedT = Math.max(0.0001, Math.min(0.9999, t));
    const curve = HighwayEngine.spline;

    // Current car point along curve
    const pos = curve.getPointAt(clampedT);
    const forward = curve.getTangentAt(clampedT).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Road contact elevation offset
    pos.y += 0.28;
    HighwayEngine.car.position.copy(pos);

    // Look along highway spline tangent
    const lookTarget = pos.clone().add(forward);
    HighwayEngine.car.lookAt(lookTarget);

    // Rotate Wheels based on velocity
    const deltaProgress = clampedT - HighwayEngine.progress;
    const wheelRotSpeed = deltaProgress * 220.0;
    HighwayEngine.wheels.forEach(wheel => {
      wheel.rotation.x += wheelRotSpeed;
    });

    // Dynamic Camera Follow Choreography
    updateCameraPosition(clampedT, pos, forward);

    // Update Environment Theme based on highway zone
    updateEnvironmentTheme(clampedT);
  }

  function updateCameraPosition(t, carPos, carForward) {
    const cam = HighwayEngine.camera;
    if (!cam) return;

    // Hero Section: Front 3/4 beauty angle
    if (t < 0.08) {
      const heroOffset = new THREE.Vector3(-3.8, 1.4, -4.5);
      const camTargetPos = carPos.clone().add(heroOffset);
      cam.position.lerp(camTargetPos, 0.08);
      cam.lookAt(carPos.clone().add(new THREE.Vector3(0, 0.8, 0)));
      return;
    }

    // Driving Mode: Dynamic Over-the-Shoulder Chase Camera
    const chaseDistance = (t > 0.85) ? 7.5 : 6.2;
    const chaseHeight = (t > 0.85) ? 2.8 : 2.4;

    // Follow behind car forward direction
    const camPos = carPos.clone()
      .addScaledVector(carForward, -chaseDistance)
      .add(new THREE.Vector3(0, chaseHeight, 0));

    // Subtle lateral sway on curves
    const normal = new THREE.Vector3(0, 1, 0);
    const lateral = new THREE.Vector3().crossVectors(carForward, normal).normalize();
    camPos.addScaledVector(lateral, Math.sin(t * 30.0) * 0.4);

    cam.position.lerp(camPos, 0.1);

    // Look slightly ahead of the car hood
    const lookAhead = carPos.clone().addScaledVector(carForward, 12.0).add(new THREE.Vector3(0, 1.2, 0));
    cam.lookAt(lookAhead);
  }

  function updateEnvironmentTheme(t) {
    const themes = HighwayEngine.themes;
    let currentTheme = themes[0];
    let nextTheme = themes[themes.length - 1];

    for (let i = 0; i < themes.length - 1; i++) {
      if (t >= themes[i].t && t <= themes[i + 1].t) {
        currentTheme = themes[i];
        nextTheme = themes[i + 1];
        break;
      }
    }

    const span = Math.max(0.001, nextTheme.t - currentTheme.t);
    const factor = Math.min(1.0, Math.max(0.0, (t - currentTheme.t) / span));

    // Fog color interpolation
    const cFog1 = new THREE.Color(currentTheme.fog);
    const cFog2 = new THREE.Color(nextTheme.fog);
    cFog1.lerp(cFog2, factor);
    HighwayEngine.scene.fog.color.copy(cFog1);
    HighwayEngine.renderer.setClearColor(cFog1);

    // Light color interpolation
    const cLight1 = new THREE.Color(currentTheme.light);
    const cLight2 = new THREE.Color(nextTheme.light);
    cLight1.lerp(cLight2, factor);
    if (HighwayEngine.hemiLight) HighwayEngine.hemiLight.color.copy(cLight1);
  }

  // --- 10. GSAP ScrollTrigger & Scroll Driver ---
  function setupScrollSync() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded, fallback to native wheel');
      window.addEventListener('scroll', () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = window.scrollY / Math.max(1, maxScroll);
        HighwayEngine.targetProgress = progress;
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Setup Lenis Smooth Scroll if available
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    // Master Highway ScrollTrigger Timeline
    ScrollTrigger.create({
      trigger: '#scroll-highway-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0,
      onUpdate: (self) => {
        HighwayEngine.targetProgress = self.progress;

        // Update active floating navigation pill & HUD speedometer
        updateHUDandNavigation(self.progress);
      }
    });
  }

  function updateHUDandNavigation(p) {
    // HUD Speedometer calculation
    const speedEl = document.getElementById('hud-speed-value');
    if (speedEl) {
      const simulatedKmh = (p < 0.05 || p > 0.95) ? Math.round(p * 200) : Math.round(95 + Math.sin(p * 20) * 35);
      speedEl.textContent = simulatedKmh;
    }

    // Journey progress bar
    const progBar = document.getElementById('hud-progress-fill');
    if (progBar) {
      progBar.style.width = (p * 100).toFixed(1) + '%';
    }

    // Active nav links
    const navSections = [
      { id: 'nav-hero', min: 0.0, max: 0.12 },
      { id: 'nav-about', min: 0.12, max: 0.28 },
      { id: 'nav-android', min: 0.28, max: 0.46 },
      { id: 'nav-ai', min: 0.46, max: 0.62 },
      { id: 'nav-games', min: 0.62, max: 0.76 },
      { id: 'nav-web', min: 0.76, max: 0.88 },
      { id: 'nav-contact', min: 0.88, max: 1.0 }
    ];

    navSections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) {
        if (p >= sec.min && p <= sec.max) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
  }

  // --- 11. Loading UI Callbacks ---
  function updateLoadingProgress(percent) {
    const bar = document.getElementById('loading-bar-fill');
    const text = document.getElementById('loading-percent-text');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '%';
  }

  function dismissLoadingScreen() {
    const overlay = document.getElementById('cinematic-loader');
    if (overlay) {
      overlay.classList.add('loaded');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 700);
    }
  }

  // --- 12. Window Resize & Raycasting ---
  function onWindowResize() {
    if (!HighwayEngine.camera || !HighwayEngine.renderer) return;
    HighwayEngine.camera.aspect = window.innerWidth / window.innerHeight;
    HighwayEngine.camera.updateProjectionMatrix();
    HighwayEngine.renderer.setSize(window.innerWidth, window.innerHeight);
    HighwayEngine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function onSceneClick(e) {
    // 3D Raycasting for roadside clickable project displays
    HighwayEngine.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    HighwayEngine.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    HighwayEngine.raycaster.setFromCamera(HighwayEngine.mouse, HighwayEngine.camera);
    const intersects = HighwayEngine.raycaster.intersectObjects(HighwayEngine.billboards, true);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData && obj.userData.projectId) {
        if (typeof window.openScreenshotModal === 'function') {
          window.openScreenshotModal(obj.userData.projectId);
        }
      }
    }
  }

  // --- 13. Main 60fps Animation Loop ---
  function animate() {
    requestAnimationFrame(animate);

    const dt = HighwayEngine.clock.getDelta();

    // Smooth lerp progress towards targetProgress
    const lerpFactor = 0.08;
    HighwayEngine.progress += (HighwayEngine.targetProgress - HighwayEngine.progress) * lerpFactor;

    // Update Car, Camera and Environment
    updateCarPosition(HighwayEngine.progress);

    // Render Scene
    if (HighwayEngine.renderer && HighwayEngine.scene && HighwayEngine.camera) {
      HighwayEngine.renderer.render(HighwayEngine.scene, HighwayEngine.camera);
    }
  }

  // Expose to window for external controls
  window.ZubairHighwayEngine = HighwayEngine;

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', HighwayEngine.init);
  } else {
    HighwayEngine.init();
  }
})();
