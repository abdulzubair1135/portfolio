/**
 * ZUBAIR WORLD — Interactive 3D Physics Developer Portfolio Engine
 * Inspired by Bruno Simon's 3D Interactive Portfolio Experience (https://bruno-simon.com)
 * Warm Pastel Clay Orange Aesthetic, Low-Poly Toy Physics Car, 3D Block Text, Interactive Playground
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
    physicsBoxes: [], // Dynamic knockable crates!

    // Visual Objects
    carMesh: null,
    headlights: [],
    projectWaypoints: [],
    interactiveObjects: [],
    zones: [],

    // Inputs & Control State
    inputs: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false,
      boost: false
    },

    // Vehicle Tuning (Fun, Springy, Responsive Toy RC Car)
    engineForce: 2400,
    brakeForce: 75,
    maxSteerVal: 0.52,
    currentSteer: 0,
    currentEngineForce: 0,
    currentBrake: 0,

    // Audio Engine
    audioCtx: null,
    audioMuted: false,
    engineOsc: null,
    engineGain: null,

    // Runtime state
    isModalOpen: false,
    nearestWaypoint: null,
    sun: null
  };

  window.ZubairWorld = ZubairWorld;

  // --- 1. Master Engine Initialization ---
  ZubairWorld.init = function () {
    ZubairWorld.canvas = document.getElementById('webgl-highway');
    if (!ZubairWorld.canvas) return;

    ZubairWorld.clock = new THREE.Clock();

    // Scene & Warm Bruno Simon Clay Atmosphere
    ZubairWorld.scene = new THREE.Scene();
    const BG_COLOR = 0xff9752; // Exact Bruno Simon vibrant warm clay orange // Warm pastel orange clay color
    ZubairWorld.scene.background = new THREE.Color(BG_COLOR);
    ZubairWorld.scene.fog = new THREE.FogExp2(BG_COLOR, 0.0028);

    // Camera (Isometric / High-Angle Automotive Perspective)
    const aspect = window.innerWidth / window.innerHeight;
    ZubairWorld.camera = new THREE.PerspectiveCamera(46, aspect, 0.2, 2500);
    ZubairWorld.camera.position.set(17, 16, 27);

    // WebGL Renderer
    ZubairWorld.renderer = new THREE.WebGLRenderer({
      canvas: ZubairWorld.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    ZubairWorld.renderer.setSize(window.innerWidth, window.innerHeight);
    ZubairWorld.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ZubairWorld.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    ZubairWorld.renderer.toneMappingExposure = 1.0;
    ZubairWorld.renderer.shadowMap.enabled = true;
    ZubairWorld.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize Cannon.js Physics
    initPhysics();

    // Initialize Lighting Architecture
    initLighting();

    // Build World Terrain, Stepping Stones & Environment
    buildWorldEnvironment();

    // Build Huge 3D Block Text ("SHAIKH ABDUL ZUBAIR")
    build3DTextName();

    // Build Playground Props (Trees, Rocks, Signs, Knockable Crates)
    buildPlaygroundProps();

    // Build the 7 Exploration Zones & Project Billboards
    buildWorldZones();

    // Setup 3D Vehicle Physics & Toy Truck Model
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
    ZubairWorld.world.gravity.set(0, -22, 0); // Snappy toy physics gravity
    ZubairWorld.world.broadphase = new CANNON.SAPBroadphase(ZubairWorld.world);
    ZubairWorld.world.defaultContactMaterial.friction = 0.55;
    ZubairWorld.world.defaultContactMaterial.restitution = 0.12;

    // Infinite Ground Plane
    const groundMat = new CANNON.Material('ground');
    const groundShape = new CANNON.Plane();
    ZubairWorld.groundBody = new CANNON.Body({ mass: 0, material: groundMat });
    ZubairWorld.groundBody.addShape(groundShape);
    ZubairWorld.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    ZubairWorld.world.addBody(ZubairWorld.groundBody);
  }

  // --- 3. Lighting Architecture ---
  function initLighting() {
    // Soft Warm Hemisphere Light (Sky: Soft Cream, Ground: Warm Terracotta)
    const hemiLight = new THREE.HemisphereLight(0xfff5ee, 0xbb5511, 0.65);
    hemiLight.position.set(0, 150, 0);
    ZubairWorld.scene.add(hemiLight);

    // Warm Golden Sunlight (Directional with Deep Soft Shadows)
    const sun = new THREE.DirectionalLight(0xfffaea, 1.15);
    sun.position.set(70, 130, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 400;
    const d = 130;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.00005;
    sun.shadow.normalBias = 0.02;
    ZubairWorld.scene.add(sun);
    ZubairWorld.sun = sun;

    // Subtle Ambient Fill
    const ambient = new THREE.AmbientLight(0xffeedd, 0.2);
    ZubairWorld.scene.add(ambient);
  }

  // --- 4. World Environment, Terrain & Stepping Stones ---
  function buildWorldEnvironment() {
    // Iconic Bruno Simon Warm Pastel Orange Clay Floor
    const groundGeo = new THREE.PlaneGeometry(1500, 1500, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xff9752, // Exact Bruno Simon vibrant warm clay orange
      roughness: 0.88,
      metalness: 0.04
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    ZubairWorld.scene.add(groundMesh);

    // Stepping Stone Pathway / Track Tiles leading through the world
    buildSteppingStoneTrack();

    // World Boundary Collision Walls
    addPhysicsWall(-140, 2, -180, 1, 6, 420);
    addPhysicsWall(140, 2, -180, 1, 6, 420);
    addPhysicsWall(0, 2, 45, 280, 6, 1);
    addPhysicsWall(0, 2, -420, 280, 6, 1);
  }

  function buildSteppingStoneTrack() {
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0xfffcf7, // Clean off-white stone tiles
      roughness: 0.7,
      metalness: 0.05
    });

    // Central pathway stepping stones
    const tileGeo = new THREE.BoxGeometry(2.4, 0.08, 1.6);
    for (let z = 20; z >= -380; z -= 3.8) {
      const tile1 = new THREE.Mesh(tileGeo, tileMat);
      tile1.position.set(-1.8, 0.04, z);
      tile1.receiveShadow = true;
      ZubairWorld.scene.add(tile1);

      const tile2 = new THREE.Mesh(tileGeo, tileMat);
      tile2.position.set(1.8, 0.04, z);
      tile2.receiveShadow = true;
      ZubairWorld.scene.add(tile2);
    }

    // Branch to Android City & AI Lab (West)
    for (let x = -4; x >= -85; x -= 3.8) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.4), tileMat);
      tile.position.set(x, 0.04, -115);
      tile.receiveShadow = true;
      ZubairWorld.scene.add(tile);
    }
    for (let x = -4; x >= -85; x -= 3.8) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.4), tileMat);
      tile.position.set(x, 0.04, -265);
      tile.receiveShadow = true;
      ZubairWorld.scene.add(tile);
    }

    // Branch to Gaming Realm & Web Metro (East)
    for (let x = 4; x <= 85; x += 3.8) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.4), tileMat);
      tile.position.set(x, 0.04, -115);
      tile.receiveShadow = true;
      ZubairWorld.scene.add(tile);
    }
    for (let x = 4; x <= 85; x += 3.8) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.4), tileMat);
      tile.position.set(x, 0.04, -250);
      tile.receiveShadow = true;
      ZubairWorld.scene.add(tile);
    }
  }

  function addPhysicsWall(x, y, z, wx, wy, wz) {
    if (!ZubairWorld.world) return;
    const shape = new CANNON.Box(new CANNON.Vec3(wx / 2, wy / 2, wz / 2));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(x, y, z);
    ZubairWorld.world.addBody(body);
  }

  // --- 5. Huge 3D Extruded Block Letters ("SHAIKH ABDUL ZUBAIR") ---
  function build3DTextName() {
    const textGroup = new THREE.Group();
    // Positioned right in front of the car start position
    textGroup.position.set(0, 0, 4);

    const letterMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp pure white
      roughness: 0.35,
      metalness: 0.05
    });

    // Helper to create bold block letter using BoxGeometry combination
    function createLetter(char, size = 1) {
      const g = new THREE.Group();
      const d = 1.0; // Depth of 3D letter
      const h = 2.4 * size;
      const w = 1.6 * size;
      const t = 0.42 * size; // Bar thickness

      const makeBox = (bx, by, bz, px, py, pz) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(bx, by, bz), letterMat);
        m.position.set(px, py, pz);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
      };

      switch (char.toUpperCase()) {
        case 'S':
          makeBox(w, t, d, 0, h - t/2, 0);
          makeBox(t, h/2, d, -w/2 + t/2, h * 0.75, 0);
          makeBox(w, t, d, 0, h/2, 0);
          makeBox(t, h/2, d, w/2 - t/2, h * 0.25, 0);
          makeBox(w, t, d, 0, t/2, 0);
          break;
        case 'H':
          makeBox(t, h, d, -w/2 + t/2, h/2, 0);
          makeBox(t, h, d, w/2 - t/2, h/2, 0);
          makeBox(w - t, t, d, 0, h/2, 0);
          break;
        case 'A':
          makeBox(t, h, d, -w/2 + t/2, h/2, 0);
          makeBox(t, h, d, w/2 - t/2, h/2, 0);
          makeBox(w, t, d, 0, h - t/2, 0);
          makeBox(w - t, t, d, 0, h * 0.45, 0);
          break;
        case 'I':
          makeBox(w, t, d, 0, h - t/2, 0);
          makeBox(t, h - t*2, d, 0, h/2, 0);
          makeBox(w, t, d, 0, t/2, 0);
          break;
        case 'K':
          makeBox(t, h, d, -w/2 + t/2, h/2, 0);
          makeBox(w * 0.7, t, d, 0.1, h * 0.65, 0);
          makeBox(w * 0.75, t, d, 0.15, h * 0.28, 0);
          break;
        case 'B':
          makeBox(t, h, d, -w/2 + t/2, h/2, 0);
          makeBox(w * 0.8, t, d, 0, h - t/2, 0);
          makeBox(t, h * 0.45, d, w/2 - t/2, h * 0.75, 0);
          makeBox(w * 0.8, t, d, 0, h/2, 0);
          makeBox(t, h * 0.45, d, w/2 - t/2, h * 0.25, 0);
          makeBox(w * 0.8, t, d, 0, t/2, 0);
          break;
        case 'D':
          makeBox(t, h, d, -w/2 + t/2, h/2, 0);
          makeBox(w * 0.7, t, d, -0.1, h - t/2, 0);
          makeBox(w * 0.7, t, d, -0.1, t/2, 0);
          makeBox(t, h - t*1.5, d, w/2 - t/2, h/2, 0);
          break;
        case 'U':
          makeBox(t, h, d, -w/2 + t/2, h/2, 0);
          makeBox(t, h, d, w/2 - t/2, h/2, 0);
          makeBox(w, t, d, 0, t/2, 0);
          break;
        case 'L':
          makeBox(t, h, d, -w/2 + t/2, h/2, 0);
          makeBox(w, t, d, 0, t/2, 0);
          break;
        case 'Z':
          makeBox(w, t, d, 0, h - t/2, 0);
          makeBox(w * 0.6, t, d, 0.1, h * 0.65, 0);
          makeBox(w * 0.6, t, d, -0.1, h * 0.35, 0);
          makeBox(w, t, d, 0, t/2, 0);
          break;
        case 'R':
          makeBox(t, h, d, -w/2 + t/2, h/2, 0);
          makeBox(w * 0.8, t, d, 0, h - t/2, 0);
          makeBox(t, h * 0.45, d, w/2 - t/2, h * 0.75, 0);
          makeBox(w * 0.8, t, d, 0, h/2, 0);
          makeBox(w * 0.7, t, d, 0.15, h * 0.25, 0);
          break;
        default:
          makeBox(w, h, d, 0, h/2, 0);
      }
      return g;
    }

    // Build word line
    function buildWord(word, startX, startZ, scale = 1.35) {
      let curX = startX;
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        if (ch === ' ') {
          curX += 1.2 * scale;
          continue;
        }
        const letter = createLetter(ch, scale);
        letter.position.set(curX, 0, startZ);
        letter.rotation.y = -0.06; // Slight perspective angle
        textGroup.add(letter);

        // Add static physics collider box for the letter so car interacts
        addPhysicsWall(letter.position.x, 1.2 * scale, startZ, 1.8 * scale, 2.5 * scale, 1.2);
        curX += 2.4 * scale;
      }
      return curX;
    }

    // Positioned in foreground facing camera exactly like "BRUNO SIMON" in Image 1
    textGroup.position.set(-1.5, 0, 16);
    textGroup.rotation.y = Math.atan2(16, 12); // Faces camera perfectly

    // One clean magnificent line: "SHAIKH ZUBAIR"
    buildWord('SHAIKH ZUBAIR', -8.0, 0, 1.25);

    ZubairWorld.scene.add(textGroup);
  }

  // --- 6. Bruno Simon Playground Props (Trees, Rocks, Signs & Knockable Crates) ---
  function buildPlaygroundProps() {
    // 1. Stylized Low-Poly Trees (Brown cylinder trunk + Faceted Yellow/Lime Canopies)
    const treePositions = [
      [-16, 0, 8], [-12, 0, 14], [14, 0, 12], [18, 0, 6],
      [-24, 0, -30], [22, 0, -45], [-20, 0, -70], [25, 0, -85],
      [-110, 0, -115], [-95, 0, -145], [110, 0, -115], [95, 0, -140],
      [-22, 0, -180], [24, 0, -210], [-25, 0, -310], [22, 0, -330],
      [-15, 0, -390], [15, 0, -390]
    ];

    treePositions.forEach((pos, idx) => {
      buildStylizedTree(pos[0], pos[1], pos[2], idx % 2 === 0 ? 0xfbbf24 : 0x84cc16);
    });

    // 2. Low-Poly White Rocks & Pebbles Clusters
    const rockPositions = [
      [-7, 0, 6], [8, 0, 5], [-9, 0, -15], [10, 0, -20],
      [-14, 0, -50], [15, 0, -60], [-10, 0, -100], [12, 0, -130],
      [-15, 0, -240], [16, 0, -270], [-8, 0, -360], [8, 0, -360]
    ];

    rockPositions.forEach(pos => {
      buildRockCluster(pos[0], pos[1], pos[2]);
    });

    // 3. Wooden Directional Signposts ([ ➔ PROJECTS ], [ ➔ ANDROID APKS ], [ ➔ AI LAB ])
    buildWoodenSignPost(5.5, 0, 2, 'PROJECTS ➔', 0x3b82f6);
    buildWoodenSignPost(-5.5, 0, -105, '➔ ANDROID APKS', 0x22c55e);
    buildWoodenSignPost(5.5, 0, -105, 'GAMES & RTS ➔', 0xef4444);
    buildWoodenSignPost(-5.5, 0, -250, '➔ AI LAB & LLMS', 0x6366f1);
    buildWoodenSignPost(5.5, 0, -250, 'WEB METRO ➔', 0x10b981);

    // 4. Knockable Dynamic Physics Crates (Bruno Simon Physics Fun!)
    buildKnockableCrateCluster(-4.5, 1.2, -18, 3);
    buildKnockableCrateCluster(4.5, 1.2, -80, 4);
    buildKnockableCrateCluster(-5, 1.2, -210, 3);
  }

  function buildStylizedTree(x, y, z, canopyColor) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 3.2, 7), trunkMat);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Faceted Canopy (Gem-like / Dodecahedron)
    const canopyMat = new THREE.MeshStandardMaterial({
      color: canopyColor, // Bright Sunny Yellow or Lime Green
      roughness: 0.75,
      flatShading: true
    });
    const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 0), canopyMat);
    canopy.position.y = 4.2;
    canopy.rotation.y = Math.random() * Math.PI;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    group.add(canopy);

    ZubairWorld.scene.add(group);

    // Physics collider for trunk
    addPhysicsWall(x, 1.6, z, 0.8, 3.2, 0.8);
  }

  function buildRockCluster(x, y, z) {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Crisp light gray / white rock
      roughness: 0.85,
      flatShading: true
    });

    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const s = 0.5 + Math.random() * 0.9;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
      const ox = (Math.random() - 0.5) * 2.2;
      const oz = (Math.random() - 0.5) * 2.2;
      rock.position.set(x + ox, s * 0.7, z + oz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      ZubairWorld.scene.add(rock);
    }
  }

  function buildWoodenSignPost(x, y, z, text, accentColor) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Wooden post
    const postMat = new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.85 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.8, 6), postMat);
    post.position.y = 1.4;
    post.castShadow = true;
    group.add(post);

    // Wooden Arrow Plank
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.12), plankMat);
    plank.position.set(0, 2.3, 0);
    plank.castShadow = true;
    group.add(plank);

    // Colored Accent border
    const rimMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const rim = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.1, 0.14), rimMat);
    rim.position.set(0, 2.7, 0);
    group.add(rim);

    // Canvas Text Texture on the plank
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 54px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 80);

    const tex = new THREE.CanvasTexture(canvas);
    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 0.65), new THREE.MeshBasicMaterial({ map: tex }));
    signFace.position.set(0, 2.3, 0.07);
    group.add(signFace);

    group.rotation.y = x > 0 ? -0.4 : 0.4;
    ZubairWorld.scene.add(group);

    // Collider
    addPhysicsWall(x, 1.4, z, 0.4, 2.8, 0.4);
  }

  function buildKnockableCrateCluster(x, y, z, count) {
    if (!ZubairWorld.world) return;

    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red supply crate with wood borders
      roughness: 0.6,
      metalness: 0.1
    });

    for (let i = 0; i < count; i++) {
      const s = 1.4;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), crateMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const px = x + (i % 2 === 0 ? 0 : 0.8);
      const py = y + i * 1.45;
      const pz = z + (i > 1 ? 0.6 : 0);
      mesh.position.set(px, py, pz);
      ZubairWorld.scene.add(mesh);

      // Cannon.js Dynamic Box Body
      const shape = new CANNON.Box(new CANNON.Vec3(s / 2, s / 2, s / 2));
      const body = new CANNON.Body({
        mass: 35, // Knockable mass!
        position: new CANNON.Vec3(px, py, pz)
      });
      body.addShape(shape);
      ZubairWorld.world.addBody(body);

      ZubairWorld.physicsBoxes.push({ mesh, body });
    }
  }

  // --- 7. The 7 World Zones & Interactive Project Billboards ---
  function buildWorldZones() {
    const zoneDefs = [
      { id: 'garage', name: 'Zone 1: Home Garage', pos: [0, 0, 15], color: 0xffa060, tag: 'STARTING GARAGE' },
      { id: 'android', name: 'Zone 2: Android City', pos: [-75, 0, -115], color: 0x3DDC84, tag: 'ANDROID APPS & MESH' },
      { id: 'ai', name: 'Zone 3: AI Research Lab', pos: [-80, 0, -270], color: 0x3b82f6, tag: 'AUTONOMOUS AI & LLMs' },
      { id: 'gaming', name: 'Zone 4: Gaming Realm', pos: [75, 0, -115], color: 0xef4444, tag: 'GAME ENGINES & RTS' },
      { id: 'web', name: 'Zone 5: Web Metro', pos: [75, 0, -250], color: 0x10b981, tag: 'CLOUD & WEB PLATFORMS' },
      { id: 'software', name: 'Zone 6: Software Workshop', pos: [0, 0, -315], color: 0x8b5cf6, tag: 'SYSTEMS & UTILITIES' },
      { id: 'destination', name: 'Zone 7: Sunset Overlook', pos: [0, 0, -395], color: 0xf59e0b, tag: 'FINAL DESTINATION & RESUME' }
    ];

    zoneDefs.forEach(z => {
      buildZoneLandmark(z);
    });

    // Populate Real Key Project Waypoints with verified screenshots
    const keyProjects = [
      { id: 'nexus-meshlink-offline', zone: 'android', pos: [-65, 0, -110], name: 'Nexus (MeshLink & PocketAI)' },
      { id: 'nearmeshchat-sahay-android', zone: 'android', pos: [-85, 0, -110], name: 'NearMeshChat (Sahay Disaster)' },
      { id: 'cyclecare-health-platform', zone: 'android', pos: [-65, 0, -135], name: 'CycleCare Health Platform' },
      { id: 'interact-app', zone: 'android', pos: [-85, 0, -135], name: 'Interakt Collaboration App' },
      { id: 'aura-autonomous-ai-system', zone: 'ai', pos: [-70, 0, -260], name: 'AURA Autonomous AI System' },
      { id: 'ai-hardware-assistant-arduino', zone: 'ai', pos: [-90, 0, -260], name: 'AI Hardware Assistant (Arduino)' },
      { id: 'draw-your-army-warforge', zone: 'gaming', pos: [65, 0, -110], name: 'WarForge: Draw Your Army (Unity RTS)' },
      { id: 'evergreen-after-the-fall-godot-rpg', zone: 'gaming', pos: [85, 0, -110], name: 'Evergreen: After The Fall (Godot 4)' },
      { id: 'minecraft-3d-voxel-engine', zone: 'gaming', pos: [65, 0, -135], name: 'Minecraft 3D Voxel Engine' },
      { id: 'srk-campus-connect', zone: 'web', pos: [65, 0, -240], name: 'SRK Campus Connect (Flutter Suite)' },
      { id: 'masipay-canteen', zone: 'web', pos: [85, 0, -240], name: 'MasiPay Canteen (Live Vercel)' },
      { id: 'projectflow-intelligence', zone: 'web', pos: [65, 0, -270], name: 'ProjectFlow Intelligence (Render Cloud)' },
      { id: 'systems-and-algorithms-cpp', zone: 'software', pos: [-12, 0, -315], name: 'Systems & Algorithms C++ Core' },
      { id: 'visual-studio-node-console', zone: 'software', pos: [12, 0, -315], name: 'Visual Studio Node.js Console' }
    ];

    keyProjects.forEach(kp => {
      buildInteractiveBillboard(kp);
    });
  }

  function buildZoneLandmark(z) {
    if (z.id === 'garage') return; // Keep garage clean and flat without z-fighting cylinder

    const group = new THREE.Group();
    group.position.set(z.pos[0], z.pos[1], z.pos[2]);

    // Clean Flat Ring on the ground
    const ringGeo = new THREE.RingGeometry(6.5, 7.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: z.color, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.04;
    group.add(ring);

    // Beacon Light
    const pLight = new THREE.PointLight(z.color, 1.5, 25);
    pLight.position.y = 4.5;
    group.add(pLight);

    ZubairWorld.scene.add(group);
  }

  function buildInteractiveBillboard(kp) {
    const group = new THREE.Group();
    group.position.set(kp.pos[0], kp.pos[1], kp.pos[2]);

    // Clean White Display Stand
    const standMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 0.5), standMat);
    stand.position.y = 2.25;
    stand.castShadow = true;
    group.add(stand);

    // High-Resolution Screenshot Frame
    const screenGeo = new THREE.PlaneGeometry(8, 4.6);
    const textureLoader = new THREE.TextureLoader();
    const screenshotUrl = 'images/screenshots/' + kp.id + '.png';

    textureLoader.load(screenshotUrl, function (tex) {
      tex.generateMipmaps = true;
      const screenMat = new THREE.MeshBasicMaterial({ map: tex });
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.y = 6.2;
      screenMesh.castShadow = true;
      group.add(screenMesh);
    }, undefined, function () {
      const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const fallbackMesh = new THREE.Mesh(screenGeo, fallbackMat);
      fallbackMesh.position.y = 6.2;
      group.add(fallbackMesh);
    });

    // Outer Bevel Frame
    const frameGeo = new THREE.BoxGeometry(8.4, 5.0, 0.3);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 6.2;
    frame.castShadow = true;
    group.add(frame);

    // Physical Collider around billboard pole
    addPhysicsWall(kp.pos[0], 2.25, kp.pos[2], 1.5, 4.5, 1.5);

    // Proximity interaction metadata
    group.userData = {
      projectId: kp.id,
      name: kp.name,
      pos: kp.pos,
      radius: 9.0
    };

    ZubairWorld.interactiveObjects.push(group);
    ZubairWorld.scene.add(group);
  }

  // --- 8. Iconic Low-Poly Red Toy Off-Road Truck / RC Buggy (Bruno Simon Style) ---
  function buildPhysicsVehicle() {
    if (!ZubairWorld.world) return;

    // Chassis Physics Body (Chunky Toy Car Physics)
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.0, 0.45, 1.8));
    ZubairWorld.chassisBody = new CANNON.Body({ mass: 850 }); // Light, responsive toy mass
    ZubairWorld.chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.5, 0));
    ZubairWorld.chassisBody.position.set(3.5, 1.6, 10); // Start at Garage behind text
    ZubairWorld.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI); // Facing South
    ZubairWorld.world.addBody(ZubairWorld.chassisBody);

    // RaycastVehicle setup
    ZubairWorld.vehicle = new CANNON.RaycastVehicle({
      chassisBody: ZubairWorld.chassisBody,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2
    });

    // Springy, bouncy toy suspension options
    const wheelOptions = {
      radius: 0.52, // Chunky big toy wheels
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 55,
      suspensionRestLength: 0.45,
      frictionSlip: 3.8,
      dampingRelaxation: 2.8,
      dampingCompression: 4.5,
      maxSuspensionForce: 100000,
      rollInfluence: 0.08,
      axleLocal: new CANNON.Vec3(-1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3()
    };

    const xOff = 1.15;
    const yOff = 0.25;
    const zOff = 1.35;

    // 4 Wheels
    wheelOptions.chassisConnectionPointLocal.set(-xOff, yOff, -zOff);
    ZubairWorld.vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(xOff, yOff, -zOff);
    ZubairWorld.vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(-xOff, yOff, zOff);
    ZubairWorld.vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(xOff, yOff, zOff);
    ZubairWorld.vehicle.addWheel(wheelOptions);

    ZubairWorld.vehicle.addToWorld(ZubairWorld.world);

    // Build 4 Visual Wheel Meshes (Chunky Black Off-Road Tires + White Rims)
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.44, 20);
    tireGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.46, 16);
    rimGeo.rotateZ(Math.PI / 2);

    ZubairWorld.wheelMeshes = [];
    for (let i = 0; i < 4; i++) {
      const wheelGroup = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(rim);

      ZubairWorld.scene.add(wheelGroup);
      ZubairWorld.wheelMeshes.push(wheelGroup);
    }

    // Build Procedural Low-Poly Toy Pickup Truck Model
    buildToyTruckModel();
  }

  function buildToyTruckModel() {
    const car = new THREE.Group();

    // Palette
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd92626, roughness: 0.4, metalness: 0.05 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2 }); // White clean glass
    const yellowLightMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    // 1. Lower Chassis & Fenders
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 3.6), darkMat);
    chassis.position.y = 0.4;
    chassis.castShadow = true;
    car.add(chassis);

    // 2. Main Red Truck Body / Hood
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 3.5), redMat);
    body.position.y = 0.8;
    body.castShadow = true;
    car.add(body);

    // 3. Cabin & Windshield
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 1.8), redMat);
    cabin.position.set(0, 1.45, -0.15);
    cabin.castShadow = true;
    car.add(cabin);

    // Front Windshield (Slanted)
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.1), glassMat);
    windshield.position.set(0, 1.45, -1.06);
    windshield.rotation.x = -0.25;
    car.add(windshield);

    // Side Windows
    const leftWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 1.2), glassMat);
    leftWindow.position.set(-0.84, 1.45, -0.15);
    car.add(leftWindow);

    const rightWindow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 1.2), glassMat);
    rightWindow.position.set(0.84, 1.45, -0.15);
    car.add(rightWindow);

    // 4. Roof Rack with 4 Yellow Spotlights
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.4), darkMat);
    rack.position.set(0, 1.88, -0.15);
    car.add(rack);

    for (let i = -0.45; i <= 0.45; i += 0.3) {
      const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 12), yellowLightMat);
      spot.rotation.x = Math.PI / 2;
      spot.position.set(i, 2.0, -0.85);
      car.add(spot);
    }

    // 5. Front Bumper, Grille & Headlights
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.32, 0.3), darkMat);
    bumper.position.set(0, 0.45, -1.85);
    car.add(bumper);

    const leftHeadlight = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12), yellowLightMat);
    leftHeadlight.rotation.x = Math.PI / 2;
    leftHeadlight.position.set(-0.65, 0.82, -1.76);
    car.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12), yellowLightMat);
    rightHeadlight.rotation.x = Math.PI / 2;
    rightHeadlight.position.set(0.65, 0.82, -1.76);
    car.add(rightHeadlight);

    // 6. Cute Radio Antenna with Red Ball (Bruno Simon Signature!)
    const antennaWire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6),
      darkMat
    );
    antennaWire.position.set(-0.65, 1.8, -1.1);
    antennaWire.rotation.x = -0.15;
    car.add(antennaWire);

    const antennaBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    antennaBall.position.set(-0.65, 2.4, -1.18);
    car.add(antennaBall);

    // 7. Rear Pickup Bed & Spare Tire
    const spareTire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), darkMat);
    spareTire.position.set(0, 1.05, 1.72);
    car.add(spareTire);

    ZubairWorld.carMesh = car;
    ZubairWorld.scene.add(car);
  }

  // --- 9. Desktop Keyboard & Mobile Touch Controls ---
  function setupControls() {
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
          ZubairWorld.inputs.brake = true;
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
          triggerWaypointInteraction();
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
          ZubairWorld.inputs.brake = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          ZubairWorld.inputs.boost = false;
          break;
      }
    });

    // Mobile touch HUD bindings
    const bindTouch = (elemId, keyProp) => {
      const el = document.getElementById(elemId);
      if (!el) return;
      const start = (e) => { e.preventDefault(); ZubairWorld.inputs[keyProp] = true; };
      const end = (e) => { e.preventDefault(); ZubairWorld.inputs[keyProp] = false; };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    };

    bindTouch('mobile-btn-up', 'forward');
    bindTouch('mobile-btn-down', 'backward');
    bindTouch('mobile-btn-left', 'left');
    bindTouch('mobile-btn-right', 'right');
    bindTouch('mobile-btn-brake', 'brake');

    const resetBtn = document.getElementById('mobile-btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetVehicle);

    const camBtn = document.getElementById('mobile-btn-cam');
    if (camBtn) camBtn.addEventListener('click', toggleCamera);
  }

  function toggleCamera() {
    const modes = ['chase', 'top', 'orbit'];
    let idx = modes.indexOf(ZubairWorld.cameraMode);
    idx = (idx + 1) % modes.length;
    ZubairWorld.cameraMode = modes[idx];
    const modeEl = document.getElementById('hud-camera-mode');
    if (modeEl) modeEl.textContent = ZubairWorld.cameraMode.toUpperCase();
  }
  ZubairWorld.toggleCamera = toggleCamera;

  function resetVehicle() {
    if (!ZubairWorld.chassisBody) return;
    ZubairWorld.chassisBody.velocity.set(0, 0, 0);
    ZubairWorld.chassisBody.angularVelocity.set(0, 0, 0);
    ZubairWorld.chassisBody.position.set(3.5, 1.8, 10);
    ZubairWorld.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI);
  }
  ZubairWorld.resetVehicle = resetVehicle;

  // --- 10. Web Audio Engine ---
  function initAudioEngine() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ZubairWorld.audioCtx = new AudioCtx();

      ZubairWorld.engineOsc = ZubairWorld.audioCtx.createOscillator();
      ZubairWorld.engineGain = ZubairWorld.audioCtx.createGain();
      ZubairWorld.engineOsc.type = 'sawtooth';
      ZubairWorld.engineOsc.frequency.setValueAtTime(55, ZubairWorld.audioCtx.currentTime);
      ZubairWorld.engineGain.gain.setValueAtTime(0, ZubairWorld.audioCtx.currentTime);

      ZubairWorld.engineOsc.connect(ZubairWorld.engineGain);
      ZubairWorld.engineGain.connect(ZubairWorld.audioCtx.destination);
      ZubairWorld.engineOsc.start();
    } catch (e) {}
  }

  ZubairWorld.toggleAudio = function () {
    ZubairWorld.audioMuted = !ZubairWorld.audioMuted;
    if (ZubairWorld.audioCtx && ZubairWorld.audioCtx.state === 'suspended') {
      ZubairWorld.audioCtx.resume();
    }
    const icon = document.getElementById('btn-sound-toggle');
    if (icon) icon.textContent = ZubairWorld.audioMuted ? '🔇 Audio Off' : '🔊 Audio On';
  };

  function updateAudio(speed) {
    if (!ZubairWorld.engineGain || ZubairWorld.audioMuted) {
      if (ZubairWorld.engineGain) ZubairWorld.engineGain.gain.setValueAtTime(0, ZubairWorld.audioCtx.currentTime);
      return;
    }
    const targetFreq = 48 + speed * 3.2;
    const targetGain = 0.04 + Math.min(speed / 80, 0.08);
    ZubairWorld.engineOsc.frequency.setTargetAtTime(targetFreq, ZubairWorld.audioCtx.currentTime, 0.05);
    ZubairWorld.engineGain.gain.setTargetAtTime(targetGain, ZubairWorld.audioCtx.currentTime, 0.05);
  }

  // --- 11. Physics Vehicle Controls & Dynamic Simulation Loop ---
  function updateVehiclePhysics(delta) {
    if (!ZubairWorld.vehicle || !ZubairWorld.chassisBody) return;

    // Steering
    const targetSteer = (ZubairWorld.inputs.left ? 1 : 0) - (ZubairWorld.inputs.right ? 1 : 0);
    ZubairWorld.currentSteer = THREE.MathUtils.lerp(
      ZubairWorld.currentSteer,
      targetSteer * ZubairWorld.maxSteerVal,
      delta * 12
    );

    ZubairWorld.vehicle.setSteeringValue(ZubairWorld.currentSteer, 0);
    ZubairWorld.vehicle.setSteeringValue(ZubairWorld.currentSteer, 1);

    // Motor Force & Boost
    let forceMultiplier = ZubairWorld.inputs.boost ? 1.6 : 1.0;
    let force = 0;
    if (ZubairWorld.inputs.forward) force = -ZubairWorld.engineForce * forceMultiplier;
    if (ZubairWorld.inputs.backward) force = ZubairWorld.engineForce * 0.7;

    ZubairWorld.vehicle.applyEngineForce(force, 2);
    ZubairWorld.vehicle.applyEngineForce(force, 3);

    // Brakes
    let brakeVal = ZubairWorld.inputs.brake ? ZubairWorld.brakeForce : 0;
    ZubairWorld.vehicle.setBrake(brakeVal, 0);
    ZubairWorld.vehicle.setBrake(brakeVal, 1);
    ZubairWorld.vehicle.setBrake(brakeVal, 2);
    ZubairWorld.vehicle.setBrake(brakeVal, 3);

    // Update Visual Wheel Meshes from Physics
    for (let i = 0; i < ZubairWorld.vehicle.wheelInfos.length; i++) {
      ZubairWorld.vehicle.updateWheelTransform(i);
      const t = ZubairWorld.vehicle.wheelInfos[i].worldTransform;
      const mesh = ZubairWorld.wheelMeshes[i];
      if (mesh) {
        mesh.position.copy(t.position);
        mesh.quaternion.copy(t.quaternion);
      }
    }

    // Update Car Body Mesh
    if (ZubairWorld.carMesh) {
      ZubairWorld.carMesh.position.copy(ZubairWorld.chassisBody.position);
      ZubairWorld.carMesh.quaternion.copy(ZubairWorld.chassisBody.quaternion);
    }

    // Update Dynamic Physics Crates
    for (let i = 0; i < ZubairWorld.physicsBoxes.length; i++) {
      const item = ZubairWorld.physicsBoxes[i];
      item.mesh.position.copy(item.body.position);
      item.mesh.quaternion.copy(item.body.quaternion);
    }

    // Telemetry HUD updates
    const speedKmh = Math.round(ZubairWorld.chassisBody.velocity.length() * 3.6);
    const speedEl = document.getElementById('hud-speed-value');
    if (speedEl) speedEl.textContent = speedKmh;

    updateAudio(speedKmh);

    const pos = ZubairWorld.chassisBody.position;
    const coordEl = document.getElementById('hud-coords-value');
    if (coordEl) {
      coordEl.textContent = `X: ${Math.round(pos.x)} | Z: ${Math.round(pos.z)}`;
    }

    // Current Zone detection
    detectCurrentZone(pos.x, pos.z);

    // Proximity Project Detection
    detectNearestWaypoint(pos);
  }

  function detectCurrentZone(x, z) {
    let zoneName = 'HOME GARAGE';
    if (z > -50) zoneName = 'HOME GARAGE';
    else if (x < -30 && z > -180) zoneName = 'ANDROID CITY (15 APKs)';
    else if (x < -30 && z <= -180) zoneName = 'AI RESEARCH LAB';
    else if (x > 30 && z > -180) zoneName = 'GAMING REALM (15 GAMES)';
    else if (x > 30 && z <= -180) zoneName = 'WEB DEV METRO';
    else if (z < -350) zoneName = 'SUNSET OVERLOOK';
    else zoneName = 'SOFTWARE WORKSHOP';

    const zEl = document.getElementById('hud-zone-name');
    if (zEl && zEl.textContent !== zoneName) zEl.textContent = zoneName;
  }

  function detectNearestWaypoint(carPos) {
    let nearest = null;
    let minDist = 999;

    ZubairWorld.interactiveObjects.forEach(obj => {
      const dx = obj.position.x - carPos.x;
      const dz = obj.position.z - carPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < obj.userData.radius && dist < minDist) {
        minDist = dist;
        nearest = obj;
      }
    });

    ZubairWorld.nearestWaypoint = nearest;

    const promptEl = document.getElementById('interaction-prompt-hud');
    if (promptEl) {
      if (nearest) {
        promptEl.classList.add('active');
        const titleEl = document.getElementById('prompt-project-title');
        if (titleEl) titleEl.textContent = nearest.userData.name;
      } else {
        promptEl.classList.remove('active');
      }
    }
  }

  function triggerWaypointInteraction() {
    if (ZubairWorld.nearestWaypoint && typeof window.openScreenshotModal === 'function') {
      window.openScreenshotModal(ZubairWorld.nearestWaypoint.userData.projectId);
    }
  }

  // --- 12. Camera Follow Logic (Smooth Bruno Simon High-Angle Chase) ---
  function updateCamera() {
    if (!ZubairWorld.chassisBody) return;

    const carPos = ZubairWorld.chassisBody.position;

    if (ZubairWorld.cameraMode === 'top') {
      ZubairWorld.camera.position.set(carPos.x, carPos.y + 40, carPos.z);
      ZubairWorld.camera.lookAt(carPos.x, carPos.y, carPos.z);
    } else {
      // Iconic Bruno Simon 3/4 isometric perspective
      const camOffset = new THREE.Vector3(14, 15, 17);
      const desiredPos = new THREE.Vector3(
        carPos.x + camOffset.x,
        carPos.y + camOffset.y,
        carPos.z + camOffset.z
      );

      ZubairWorld.camera.position.lerp(desiredPos, 0.08);
      ZubairWorld.camera.lookAt(carPos.x - 3.5, carPos.y + 0.6, carPos.z - 1.5);
    }
  }

  // --- 13. Master Animation Loop ---
  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(ZubairWorld.clock.getDelta(), 0.1);

    if (ZubairWorld.world) {
      ZubairWorld.world.step(1 / 60, delta, 3);
    }

    updateVehiclePhysics(delta);
    updateCamera();

    ZubairWorld.renderer.render(ZubairWorld.scene, ZubairWorld.camera);
  }

  function onWindowResize() {
    if (!ZubairWorld.camera || !ZubairWorld.renderer) return;
    ZubairWorld.camera.aspect = window.innerWidth / window.innerHeight;
    ZubairWorld.camera.updateProjectionMatrix();
    ZubairWorld.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function handleKeyInteractions(e) {
    if (e.key === 'e' || e.key === 'E') {
      triggerWaypointInteraction();
    }
  }

  function dismissLoader() {
    const loader = document.getElementById('cinematic-loader');
    if (loader) {
      loader.classList.add('loaded');
      setTimeout(() => loader.style.display = 'none', 600);
    }
  }

  // Auto initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ZubairWorld.init);
  } else {
    ZubairWorld.init();
  }
})();
