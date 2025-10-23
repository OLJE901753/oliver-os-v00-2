// WireframePulseShader.ts
// Custom GLSL shader for the central figure's wireframe glow effect

import * as THREE from 'three';

export const WireframePulseShader = {
  uniforms: {
    uTime: { value: 0.0 },
    uColor: { value: [1.0, 0.0, 1.0] }, // Magenta base color
    uGlowIntensity: { value: 1.0 },
    uPulseSpeed: { value: 2.0 }
  },
  
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      vPosition = position;
      vNormal = normal;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uGlowIntensity;
    uniform float uPulseSpeed;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      // Create wireframe effect using UV coordinates
      float wireframe = 1.0 - smoothstep(0.0, 0.02, abs(sin(vUv.x * 50.0)) * abs(sin(vUv.y * 50.0)));
      
      // Add additional wireframe lines
      float wireframe2 = 1.0 - smoothstep(0.0, 0.01, abs(sin(vUv.x * 100.0)) * abs(sin(vUv.y * 100.0)));
      
      // Combine wireframe effects
      float finalWireframe = max(wireframe, wireframe2 * 0.5);
      
      // Create rhythmic pulse animation
      float pulse = sin(uTime * uPulseSpeed) * 0.3 + 0.7;
      
      // Add subtle breathing effect
      float breath = sin(uTime * 0.5) * 0.1 + 0.9;
      
      // Create glow effect
      float glow = finalWireframe * uGlowIntensity * pulse * breath;
      
      // Add inner structure visibility
      float innerGlow = sin(vPosition.y * 8.0 + uTime) * 0.3 + 0.7;
      innerGlow += sin(vPosition.z * 6.0 + uTime * 1.5) * 0.2;
      innerGlow += sin(vPosition.x * 4.0 + uTime * 0.8) * 0.1;
      
      // Combine all effects
      vec3 finalColor = uColor * glow * innerGlow;
      
      // Add subtle color variation
      finalColor += vec3(0.0, 0.5, 1.0) * glow * 0.3; // Add cyan tint
      
      gl_FragColor = vec4(finalColor, glow);
    }
  `,
  
  transparent: true,
  side: THREE.DoubleSide
};
