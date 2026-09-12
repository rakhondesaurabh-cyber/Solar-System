import * as THREE from 'three';
import { CelestialBody } from './CelestialBody';
import { calculatePosition, satelliteElements } from '../utils/ephemeris';
import type { OrbitalElements } from '../utils/ephemeris';
import { DISTANCE_SCALE } from '../utils/constants';
import type { SatelliteConfig } from '../utils/constants';

export class Satellite extends CelestialBody {
  private elements: OrbitalElements;
  private config: SatelliteConfig;

  constructor(config: SatelliteConfig) {
    super();
    this.config = config;
    this.elements = satelliteElements[config.name.replace(/\s+/g, '')];

    if (config.type === 'parker_solar_probe') {
      this.buildParkerSolarProbe();
    } else {
      // Generic fallback satellite (just a small box)
      const geometry = new THREE.BoxGeometry(config.scale, config.scale, config.scale);
      const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const mesh = new THREE.Mesh(geometry, material);
      this.mesh.add(mesh);
    }
  }

  private buildParkerSolarProbe() {
    const group = new THREE.Group();
    const scale = this.config.scale;

    // Heat shield (white, flat cylinder facing front/Sun)
    const shieldGeom = new THREE.CylinderGeometry(scale * 1.5, scale * 1.5, scale * 0.2, 32);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x999999 });
    const shield = new THREE.Mesh(shieldGeom, shieldMat);
    // Rotate so the flat face points in the Z direction
    shield.rotation.x = Math.PI / 2;
    shield.position.z = scale * 1.0; 
    group.add(shield);

    // Main body (gold/metallic hexagonal or box)
    const bodyGeom = new THREE.BoxGeometry(scale, scale, scale * 1.5);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x886600 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.z = 0;
    group.add(body);

    // Solar arrays (blue panels)
    const panelGeom = new THREE.BoxGeometry(scale * 4, scale * 0.1, scale * 0.5);
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x112266 });
    const panels = new THREE.Mesh(panelGeom, panelMat);
    panels.position.z = -scale * 0.2;
    group.add(panels);

    // Add everything to the main mesh
    this.mesh.add(group);
  }

  update(time: Date) {
    if (!this.elements) return;
    
    // 1. Calculate Orbit Position
    const pos = calculatePosition(this.elements, time);
    this.mesh.position.set(pos.x * DISTANCE_SCALE, pos.y * DISTANCE_SCALE, pos.z * DISTANCE_SCALE);

    // 2. Point towards the Sun (0, 0, 0)
    // lookAt points the local -Z axis towards the target if we don't adjust,
    // wait, in Three.js lookAt points the object's local +Z axis towards the target!
    // So if the shield is at +Z, it will point directly at the Sun.
    this.mesh.lookAt(0, 0, 0); 
  }
}
