// Simplified Keplerian elements for major planets (J2000 epoch)
// Elements:
// a: semi-major axis (AU)
// e: eccentricity
// i: inclination (degrees)
// L: mean longitude (degrees)
// long_peri: longitude of perihelion (degrees)
// long_node: longitude of ascending node (degrees)

export interface OrbitalElements {
  a: number;
  e: number;
  i: number;
  L: number;
  long_peri: number;
  long_node: number;
  // Rates per century
  a_dot?: number;
  e_dot?: number;
  i_dot?: number;
  L_dot?: number;
  long_peri_dot?: number;
  long_node_dot?: number;
}

export const planetElements: Record<string, OrbitalElements> = {
  Mercury: { a: 0.38709927, e: 0.20563593, i: 7.00497902, L: 252.2503235, long_peri: 77.45779628, long_node: 48.33076593, L_dot: 149472.67 },
  Venus: { a: 0.72333566, e: 0.00677672, i: 3.39467605, L: 181.9790995, long_peri: 131.60246718, long_node: 76.67984255, L_dot: 58517.81 },
  Earth: { a: 1.00000261, e: 0.01671123, i: -0.00001531, L: 100.46457166, long_peri: 102.93768193, long_node: 0.0, L_dot: 35999.37 },
  Mars: { a: 1.52371034, e: 0.0933941, i: 1.84969142, L: -4.55343205, long_peri: -23.94362959, long_node: 49.55953891, L_dot: 19140.30 },
  Jupiter: { a: 5.202887, e: 0.04838624, i: 1.30439695, L: 34.39644051, long_peri: 14.72847983, long_node: 100.47390909, L_dot: 3034.74 },
  Saturn: { a: 9.53667594, e: 0.05386179, i: 2.48599187, L: 49.95424423, long_peri: 92.59887831, long_node: 113.66242448, L_dot: 1222.49 },
  Uranus: { a: 19.18916464, e: 0.04725744, i: 0.77263783, L: 313.23810451, long_peri: 170.9542763, long_node: 74.01692503, L_dot: 428.48 },
  Neptune: { a: 30.06992276, e: 0.00859048, i: 1.77004347, L: -55.12002969, long_peri: 44.96476227, long_node: 131.78422574, L_dot: 218.45 },
  Pluto: { a: 39.48168677, e: 0.24880766, i: 17.14175, L: 238.92881, long_peri: 224.06676, long_node: 110.30347, L_dot: 145.20 }
};

export const satelliteElements: Record<string, OrbitalElements> = {
  ParkerSolarProbe: { a: 0.388, e: 0.88, i: 3.4, L: 0, long_peri: 315, long_node: 0, L_dot: 0 } // Approximation
};

function normalizeAngle(angle: number) {
  angle = angle % 360;
  if (angle < 0) angle += 360;
  return angle;
}

const DEG_TO_RAD = Math.PI / 180;

export function calculatePosition(elements: OrbitalElements, date: Date): { x: number, y: number, z: number } {
  // Centuries since J2000
  const J2000 = new Date('2000-01-01T12:00:00Z');
  const d = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);
  const T = d / 36525;

  // Compute elements for current time
  const a = elements.a + (elements.a_dot || 0) * T;
  const e = elements.e + (elements.e_dot || 0) * T;
  const i = (elements.i + (elements.i_dot || 0) * T) * DEG_TO_RAD;
  const L = normalizeAngle(elements.L + (elements.L_dot || 0) * T) * DEG_TO_RAD;
  const long_peri = (elements.long_peri + (elements.long_peri_dot || 0) * T) * DEG_TO_RAD;
  const long_node = (elements.long_node + (elements.long_node_dot || 0) * T) * DEG_TO_RAD;

  const w = long_peri - long_node;
  const M = L - long_peri; // Mean anomaly

  // Solve Kepler's equation (E - e*sin(E) = M)
  let E = M;
  for (let iter = 0; iter < 10; iter++) {
    const deltaE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += deltaE;
    if (Math.abs(deltaE) < 1e-6) break;
  }

  // Calculate coordinates in the orbital plane
  const x_prime = a * (Math.cos(E) - e);
  const y_prime = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate to ecliptic coordinates
  const cw = Math.cos(w);
  const sw = Math.sin(w);
  const cO = Math.cos(long_node);
  const sO = Math.sin(long_node);
  const ci = Math.cos(i);
  const si = Math.sin(i);

  const x = (cO * cw - sO * sw * ci) * x_prime + (-cO * sw - sO * cw * ci) * y_prime;
  const y = (sO * cw + cO * sw * ci) * x_prime + (-sO * sw + cO * cw * ci) * y_prime;
  const z = (sw * si) * x_prime + (cw * si) * y_prime;

  // In Three.js, Y is up, so we'll map Z (ecliptic height) to Y, and Y (ecliptic depth) to Z
  // Though conventionally XY is ecliptic plane. Let's map (x, y, z) to (x, z, -y) for Three.js
  return { x: x, y: z, z: -y };
}
