import * as THREE from 'three';
import { CelestialBody } from './CelestialBody';

export class Sun extends CelestialBody {
  private sunMesh: THREE.Mesh;
  private light: THREE.PointLight;

  constructor() {
    super();

    // The sun is huge, but we scale it for visualization purposes.
    const geometry = new THREE.SphereGeometry(5, 64, 64);

    // Attempt to load texture, fallback to color
    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffddaa, // Fallback color
    });

    textureLoader.load('/textures/2k_sun.jpg', (texture) => {
      material.map = texture;
      material.needsUpdate = true;
      material.color.setHex(0xffffff); // reset color if texture loads
    });

    this.sunMesh = new THREE.Mesh(geometry, material);
    this.mesh.add(this.sunMesh);

    // Add a point light to illuminate the solar system
    this.light = new THREE.PointLight(0xffffff, 3, 2000, 0); // High intensity, no decay
    this.mesh.add(this.light);

    // Realistic optical bloom is now handled globally by UnrealBloomPass in Application.ts
  }

  update(time: Date) {
    // Sun's equatorial rotation period is about 24.47 days (587.28 hours)
    const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
    const hoursSinceEpoch = (time.getTime() - J2000) / (1000 * 60 * 60);
    const rotationPeriod = 587.28;
    this.sunMesh.rotation.y = (hoursSinceEpoch / rotationPeriod) * Math.PI * 2;
  }
}
