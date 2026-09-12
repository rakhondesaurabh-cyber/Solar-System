import * as THREE from 'three';
import { calculatePosition } from '../utils/ephemeris';
import type { OrbitalElements } from '../utils/ephemeris';
import { DISTANCE_SCALE } from '../utils/constants';

export class OrbitLine {
  public mesh: THREE.Line;

  constructor(elements: OrbitalElements) {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    const orbitalPeriod = Math.sqrt(Math.pow(elements.a, 3)); // Kepler's 3rd law (simplified, Earth years)
    const timeStep = (orbitalPeriod * 365.25 * 24 * 60 * 60 * 1000) / segments;
    
    const baseDate = new Date('2000-01-01T12:00:00Z').getTime();

    for (let i = 0; i <= segments; i++) {
      const t = new Date(baseDate + i * timeStep);
      const pos = calculatePosition(elements, t);
      points.push(new THREE.Vector3(pos.x * DISTANCE_SCALE, pos.y * DISTANCE_SCALE, pos.z * DISTANCE_SCALE));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: 0x444444, 
      transparent: true,
      opacity: 0.5 
    });

    this.mesh = new THREE.Line(geometry, material);
  }
}
