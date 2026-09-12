import * as THREE from 'three';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Sun } from './objects/Sun';
import { Planet } from './objects/Planet';
import { OrbitLine } from './objects/OrbitLine';
import { Satellite } from './objects/Satellite';
import { PLANETS, SATELLITES, DISTANCE_SCALE } from './utils/constants';
import { planetElements, satelliteElements } from './utils/ephemeris';

export class Application {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: FlyControls;
  
  private sun: Sun;
  private planets: Planet[] = [];
  private satellites: Satellite[] = [];
  
  private timeMultiplier = 1; // 1 real second = X simulated days
  private simulatedTime: Date;
  private lastFrameTime: number;

  constructor() {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.set(0, 50, 150);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('app')?.appendChild(this.renderer.domElement);

    this.controls = new FlyControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 30; // Decreased movement/zoom sensitivity
    this.controls.rollSpeed = Math.PI / 24; // Decreased rotation sensitivity
    this.controls.autoForward = false;
    this.controls.dragToLook = true;

    // Setup Post-processing (Bloom for hyper-realistic glow)
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2.5,   // Bloom strength
      1.5,   // Bloom radius
      0.85   // Bloom threshold (only bright objects like the sun will glow)
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    // Background Stars
    this.createStarfield();

    // Lighting (Ambient for base visibility)
    const ambientLight = new THREE.AmbientLight(0x222222);
    this.scene.add(ambientLight);

    // Initialize time
    this.simulatedTime = new Date(); // Start at current real-world time
    this.lastFrameTime = performance.now();

    // Create Sun
    this.sun = new Sun();
    this.scene.add(this.sun.mesh);

    // Create Planets and Orbit Lines
    for (const key in PLANETS) {
      const config = PLANETS[key];
      const planet = new Planet(config);
      this.planets.push(planet);
      this.scene.add(planet.mesh);

      const orbitLine = new OrbitLine(planetElements[key]);
      this.scene.add(orbitLine.mesh);
    }

    // Create Satellites and Orbit Lines
    for (const key in SATELLITES) {
      const config = SATELLITES[key];
      const satellite = new Satellite(config);
      this.satellites.push(satellite);
      this.scene.add(satellite.mesh);

      const orbitLine = new OrbitLine(satelliteElements[key]);
      this.scene.add(orbitLine.mesh);
    }
    
    // Create Asteroid Belt
    this.createAsteroidBelt();

    // Setup window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Setup UI listeners
    this.setupUI();

    // Start loop
    this.animate();
  }
  
  private createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for(let i = 0; i < count * 3; i+=3) {
      // Create a sphere of stars around the scene
      const r = 2000 + Math.random() * 2000;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i+2] = r * Math.cos(phi);
      
      colors[i] = colors[i+1] = colors[i+2] = 0.5 + Math.random() * 0.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(starField);
  }

  private createAsteroidBelt() {
    const numAsteroids = 2000;
    const halfAsteroids = Math.floor(numAsteroids / 2);
    const geometry = new THREE.DodecahedronGeometry(0.2, 0); // Irregular shape
    
    const textureLoader = new THREE.TextureLoader();
    const material1 = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 });
    const material2 = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 });
    
    textureLoader.load('/textures/2k_astriod.jpg', (tex) => {
      material1.map = tex;
      material1.color.setHex(0xffffff);
      material1.needsUpdate = true;
    });

    textureLoader.load('/textures/2k_ceres_fictional.jpg', (tex) => {
      material2.map = tex;
      material2.color.setHex(0xffffff);
      material2.needsUpdate = true;
    });

    const mesh1 = new THREE.InstancedMesh(geometry, material1, halfAsteroids);
    const mesh2 = new THREE.InstancedMesh(geometry, material2, numAsteroids - halfAsteroids);

    const dummy = new THREE.Object3D();
    
    // Main asteroid belt lies between Mars (a=1.52) and Jupiter (a=5.20)
    // We'll place them roughly around 2.2 to 3.2 AU
    for (let i = 0; i < numAsteroids; i++) {
      const radiusAU = 2.2 + Math.random() * 1.0; 
      const radius = radiusAU * DISTANCE_SCALE;
      const angle = Math.random() * Math.PI * 2;
      
      // Slight variation in Y to give thickness
      const yOffset = (Math.random() - 0.5) * 2.0; 
      
      dummy.position.set(
        Math.cos(angle) * radius,
        yOffset,
        Math.sin(angle) * radius
      );
      
      // Random rotation and scale
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const scale = 0.5 + Math.random() * 1.5;
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      if (i < halfAsteroids) {
        mesh1.setMatrixAt(i, dummy.matrix);
      } else {
        mesh2.setMatrixAt(i - halfAsteroids, dummy.matrix);
      }
    }
    
    this.scene.add(mesh1);
    this.scene.add(mesh2);
  }

  private setupUI() {
    const slider = document.getElementById('speed-slider') as HTMLInputElement;
    const display = document.getElementById('speed-display');
    const resetBtn = document.getElementById('reset-time');

    if (slider && display) {
      slider.addEventListener('input', () => {
        // Map 0-10 to an exponential scale
        const val = parseFloat(slider.value);
        if (val === 0) {
          this.timeMultiplier = 0;
          display.textContent = 'Paused';
        } else {
          // e.g. val=1 -> 1 day/sec, val=10 -> 1000 days/sec
          this.timeMultiplier = Math.pow(2, val - 1);
          display.textContent = `${this.timeMultiplier.toFixed(1)} days/s`;
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.simulatedTime = new Date();
        if(slider && display) {
            slider.value = "1";
            this.timeMultiplier = 1;
            display.textContent = '1.0 days/s';
        }
      });
    }

    const realTimeBtn = document.getElementById('real-time');
    if (realTimeBtn) {
      realTimeBtn.addEventListener('click', () => {
        if(display) {
            this.timeMultiplier = 1 / 86400; // 1 real second = 1 real second
            display.textContent = 'Real Time';
        }
      });
    }
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));

    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000; // seconds since last frame
    this.lastFrameTime = now;

    // Advance simulated time
    // timeMultiplier is in days/sec, so dt * timeMultiplier is simulated days passed
    if (this.timeMultiplier > 0) {
      const msPassed = dt * this.timeMultiplier * 24 * 60 * 60 * 1000;
      this.simulatedTime.setTime(this.simulatedTime.getTime() + msPassed);
    }

    // Update bodies
    this.sun.update(this.simulatedTime);
    for (const planet of this.planets) {
      planet.update(this.simulatedTime);
    }
    for (const satellite of this.satellites) {
      satellite.update(this.simulatedTime);
    }

    // Asteroid belt could also rotate slowly, but for performance, we'll keep it static or rotate the whole group
    // In this basic version, the instanced mesh is static to represent the belt

    this.controls.update(dt);
    this.composer.render();
  }
}
