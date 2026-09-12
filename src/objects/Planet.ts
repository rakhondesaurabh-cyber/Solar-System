import * as THREE from 'three';
import { CelestialBody } from './CelestialBody';
import { calculatePosition, planetElements } from '../utils/ephemeris';
import type { OrbitalElements } from '../utils/ephemeris';
import { DISTANCE_SCALE, SIZE_SCALE } from '../utils/constants';
import type { PlanetConfig, MoonConfig } from '../utils/constants';

export class Planet extends CelestialBody {
  private planetMesh: THREE.Mesh;
  private axialGroup: THREE.Group;
  private elements: OrbitalElements;
  private config: PlanetConfig;
  private moonMeshes: { mesh: THREE.Mesh, config: MoonConfig }[] = [];

  constructor(config: PlanetConfig) {
    super();
    this.config = config;
    this.elements = planetElements[config.name];

    const radius = config.radius * SIZE_SCALE;
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    
    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.6,
      metalness: 0.1,
    });
    
    const texturePath = `/textures/2k_${config.name.toLowerCase()}.jpg`;
    textureLoader.load(texturePath, 
      (texture) => {
        material.map = texture;
        material.needsUpdate = true;
        material.color.setHex(0xffffff);
      },
      undefined,
      (_err) => {
        // Fallback to color if texture not found
      }
    );

    this.planetMesh = new THREE.Mesh(geometry, material);
    
    // Create an axial group to apply the planet's tilt
    this.axialGroup = new THREE.Group();
    this.axialGroup.rotation.z = config.axialTilt * (Math.PI / 180);
    this.axialGroup.add(this.planetMesh);
    this.mesh.add(this.axialGroup);

    // Rings
    if (config.hasRings && config.ringInner && config.ringOuter) {
      const ringGeometry = new THREE.RingGeometry(config.ringInner * SIZE_SCALE, config.ringOuter * SIZE_SCALE, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: config.ringColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      
      if (config.ringTexture) {
        textureLoader.load(config.ringTexture, (tex) => {
          ringMaterial.map = tex;
          ringMaterial.color.setHex(0xffffff);
          ringMaterial.needsUpdate = true;
        });
      }

      // Rings are typically aligned with the planet's equator
      ringMesh.rotation.x = Math.PI / 2;
      this.axialGroup.add(ringMesh);
    }
    
    // Moons
    if (config.moons) {
      for (const moon of config.moons) {
        const moonGeom = new THREE.SphereGeometry(moon.radius * SIZE_SCALE, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({ color: moon.color });
        if (moon.texture) {
          textureLoader.load(moon.texture, (tex) => {
            moonMat.map = tex;
            moonMat.needsUpdate = true;
            moonMat.color.setHex(0xffffff);
          });
        }
        const moonMesh = new THREE.Mesh(moonGeom, moonMat);
        // Align moon orbit slightly with axial tilt
        this.axialGroup.add(moonMesh);
        this.moonMeshes.push({ mesh: moonMesh, config: moon });
      }
    }
  }

  update(time: Date) {
    // 1. Calculate Orbit Position
    const pos = calculatePosition(this.elements, time);
    this.mesh.position.set(pos.x * DISTANCE_SCALE, pos.y * DISTANCE_SCALE, pos.z * DISTANCE_SCALE);

    // 2. Rotate planet on its axis based on accurate sidereal rotation period
    const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
    const hoursSinceEpoch = (time.getTime() - J2000) / (1000 * 60 * 60);
    // Complete 1 full rotation (2PI) every 'rotationPeriod' hours
    this.planetMesh.rotation.y = (hoursSinceEpoch / this.config.rotationPeriod) * Math.PI * 2;
    
    // 3. Update Moon positions
    for (const m of this.moonMeshes) {
      // time.getTime() gives milliseconds. Scale for visual orbital speed.
      const angle = time.getTime() * m.config.speed * 0.00001; 
      const distance = m.config.distance * SIZE_SCALE;
      m.mesh.position.x = Math.cos(angle) * distance;
      m.mesh.position.z = Math.sin(angle) * distance;
      m.mesh.rotation.y += 0.01; // basic rotation for moons
    }
  }
}
