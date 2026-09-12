import * as THREE from 'three';

export class CelestialBody {
  public mesh: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();
  }

  update(_time: Date) {
    // To be overridden
  }
}
