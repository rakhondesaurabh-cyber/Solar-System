export const DISTANCE_SCALE = 30; // Scale 1 AU to 30 Three.js units
export const SIZE_SCALE = 1; // Base multiplier for planet sizes
export const SUN_SIZE_SCALE = 0.05; // Sun is way too big in reality, scale it down for UI
export const TIME_SCALE_BASE = 1; // 1 second real time = 1 day simulated time

export interface MoonConfig {
  name: string;
  radius: number;
  distance: number; // Distance from the planet center
  speed: number;    // Orbital speed multiplier
  color: number;
  texture?: string;
}

export interface PlanetConfig {
  name: string;
  radius: number; // in Earth radii
  color: number;
  texture?: string;
  rotationPeriod: number; // Sidereal rotation period in hours
  axialTilt: number; // Axial tilt in degrees
  hasRings?: boolean;
  ringInner?: number;
  ringOuter?: number;
  ringColor?: number;
  ringTexture?: string;
  moons?: MoonConfig[];
}

export const PLANETS: Record<string, PlanetConfig> = {
  Mercury: { name: 'Mercury', radius: 0.383, color: 0x888888, rotationPeriod: 1407.6, axialTilt: 0.034 },
  Venus: { name: 'Venus', radius: 0.949, color: 0xe6e6fa, rotationPeriod: 5832.6, axialTilt: 177.36 },
  Earth: { 
    name: 'Earth', radius: 1, color: 0x2233ff, rotationPeriod: 23.93, axialTilt: 23.44,
    moons: [
      { name: 'Moon', radius: 0.27, distance: 2.5, speed: 0.005, color: 0xaaaaaa, texture: '/textures/2k_moon.jpg' }
    ]
  },
  Mars: { 
    name: 'Mars', radius: 0.532, color: 0xff4422, rotationPeriod: 24.62, axialTilt: 25.19,
    moons: [
      { name: 'Phobos', radius: 0.1, distance: 1.5, speed: 0.02, color: 0x888888, texture: '/textures/phobos.webp' },
      { name: 'Deimos', radius: 0.08, distance: 2.2, speed: 0.01, color: 0x999999, texture: '/textures/deimos.webp' }
    ]
  },
  Jupiter: { 
    name: 'Jupiter', radius: 11.21, color: 0xd9a473, rotationPeriod: 9.92, axialTilt: 3.13,
    moons: [
      { name: 'Io', radius: 0.28, distance: 16, speed: 0.04, color: 0xffffaa, texture: '/textures/lo.webp' },
      { name: 'Europa', radius: 0.24, distance: 19, speed: 0.02, color: 0xddddff },
      { name: 'Ganymede', radius: 0.41, distance: 24, speed: 0.01, color: 0xbbbbbb, texture: '/textures/gynamide.webp' },
      { name: 'Callisto', radius: 0.38, distance: 30, speed: 0.005, color: 0x888888 }
    ]
  }, // Scaled down in render
  Saturn: { 
    name: 'Saturn', radius: 9.45, color: 0xf2e3c6, rotationPeriod: 10.66, axialTilt: 26.73, hasRings: true, ringInner: 12, ringOuter: 20, ringColor: 0xdab784, ringTexture: '/textures/2k_saturn_ring.png',
    moons: [
      { name: 'Titan', radius: 0.4, distance: 25, speed: 0.008, color: 0xffaa44, texture: '/textures/titan.png' }
    ]
  },
  Uranus: { name: 'Uranus', radius: 4.01, color: 0x88ccff, rotationPeriod: 17.24, axialTilt: 97.77, hasRings: true, ringInner: 6, ringOuter: 8, ringColor: 0xaaaaaa },
  Neptune: { name: 'Neptune', radius: 3.88, color: 0x2244bb, rotationPeriod: 16.11, axialTilt: 28.32 },
  Pluto: { name: 'Pluto', radius: 2.5, color: 0xddccaa, rotationPeriod: 153.3, axialTilt: 122.53 },
};

export interface SatelliteConfig {
  name: string;
  type: string; // E.g. 'parker_solar_probe' to determine 3D model
  scale: number; // Scale for the 3D model so it's visible
}

export const SATELLITES: Record<string, SatelliteConfig> = {
  ParkerSolarProbe: {
    name: 'Parker Solar Probe',
    type: 'parker_solar_probe',
    scale: 0.5 // Making it large enough to see, though obviously not to real scale
  }
};
