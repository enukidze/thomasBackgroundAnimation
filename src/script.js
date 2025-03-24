// Add this at the very start of your script
if (window._guiInitialized) {
    console.warn('GUI already initialized, skipping...');
} else {
    window._guiInitialized = true;

    // Create the scene, camera, and renderer
    const scene = new THREE.Scene();

    // Set size to cover the entire window
    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
    camera.position.z = 2;

    // Calculate viewport bounds based on camera FOV and position
    const fov = camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * camera.position.z;
    const width = height * camera.aspect;

    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(WIDTH, HEIGHT);
    // Add CSS to make it cover the entire screen
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '-1'; // Place behind other content if needed
    document.body.appendChild(renderer.domElement);

    // Vertex Shader
    const vertexShader = `
      uniform float time;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment Shader with immediate animation from start
    const fragmentShader = `
      uniform float time;
      uniform float seed;
      uniform float speed;
      uniform float complexity;
      uniform float colorIntensity;
      uniform float grainAmount;
      uniform float sphereEffect;
      uniform float layerCompression;
      uniform vec3 gradient1Start;
      uniform vec3 gradient1End;
      uniform vec3 gradient2Start;
      uniform vec3 gradient2End;
      uniform vec3 gradient3Start;
      uniform vec3 gradient3End;
      varying vec2 vUv;
      
      // Include noise functions from fragment shader
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      // Add rotation function for static positioning
      vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        mat2 m = mat2(c, -s, s, c);
        return m * v;
      }
      
      // NEW: Add a pseudo-random function based on a seed value
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      // NEW: Add fractal noise function for more natural randomness
      float fractalNoise(vec2 uv, float complexity, float seed, int octaves) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        // Use different seeds for each octave for more variation
        for(int i = 0; i < octaves; i++) {
          if(i >= octaves) break; // Fix for some GPU compatibility
          value += amplitude * snoise(vec2(
            uv.x * frequency * complexity + seed * float(i) * 0.17,
            uv.y * frequency * complexity + seed * float(i) * 0.23
          ));
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
        
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= 1.4;
        float dist = length(uv);
        
        // NEW: Use prime number based timing to avoid repeating patterns
        // Use several different prime-based timescales for maximum variation
        float animTime = mod(time * speed + seed * 10.0, 1000.0);
        float animTime1 = mod(time * speed * 1.618033988749895 + seed * 7.3, 1000.0); // Golden ratio
        float animTime2 = mod(time * speed * 1.414213562373095 + seed * 3.7, 1000.0); // Square root of 2
        float animTime3 = mod(time * speed * 1.732050807568877 + seed * 5.2, 1000.0); // Square root of 3
        
        // NEW: Create a chaotic time variation based on noise
        float chaosTime = animTime + snoise(vec2(animTime * 0.01, seed)) * 10.0;
        
        // NEW: Use more irrational number relationships and varied seeds
        // Primary flow directions with non-repeating configurations
        vec2 flowPrimary1 = vec2(
          sin(animTime1 * 0.25 + seed * 1.1) * 0.6 + cos(animTime2 * 0.13) * 0.2,
          cos(animTime3 * 0.3 + seed * 0.7) * 0.6 + sin(animTime1 * 0.21) * 0.1
        );
        
        vec2 flowPrimary2 = vec2(
          cos(animTime2 * 0.15 - seed * 1.3) * 0.7 + sin(animTime3 * 0.19) * 0.15, 
          -sin(animTime1 * 0.2 - seed * 0.9) * 0.7 + cos(animTime2 * 0.11) * 0.2
        );
        
        // Secondary flow directions with chaotic variations
        vec2 flowDir1 = vec2(
          sin(animTime3 * 0.5 + seed * 1.4 + sin(chaosTime * 0.02) * 0.3) * 0.5,
          -cos(animTime2 * 0.45 + seed * 0.6 + cos(chaosTime * 0.03) * 0.2) * 0.5
        );
        
        vec2 flowDir2 = vec2(
          -cos(animTime1 * 0.4 - seed * 1.25) * 0.6 + sin(animTime3 * 0.17) * 0.2, 
          sin(animTime2 * 0.55 - seed * 0.35) * 0.4 + cos(animTime1 * 0.23) * 0.15
        );
        
        vec2 flowDir3 = vec2(
          sin(animTime2 * 0.6 + seed * 1.2 + cos(chaosTime * 0.04) * 0.25) * 0.4,
          cos(animTime1 * 0.35 + seed * 0.45 + sin(chaosTime * 0.05) * 0.3) * 0.6
        );
        
        // Cross-flowing currents with chaotic influences
        vec2 crossFlow1 = vec2(
          cos(animTime3 * 0.37 + seed * 0.92) * 0.5 + sin(chaosTime * 0.07) * 0.2, 
          sin(animTime1 * 0.28 + seed * 1.53) * 0.5 + cos(chaosTime * 0.06) * 0.1
        );
        
        vec2 crossFlow2 = vec2(
          -sin(animTime2 * 0.41 - seed * 1.31) * 0.4 + cos(chaosTime * 0.08) * 0.15,
          cos(animTime3 * 0.33 - seed * 0.42) * 0.6 + sin(chaosTime * 0.09) * 0.1
        );
        
        // Slow waves with long periods and chaotic variations
        vec2 slowWaveDir1 = vec2(
          sin(animTime1 * 0.05 + seed * 0.82) * 0.9 + cos(animTime2 * 0.023) * 0.1,
          cos(animTime3 * 0.04 + seed * 0.71) * 0.8 + sin(animTime1 * 0.017) * 0.15
        );
        
        vec2 slowWaveDir2 = vec2(
          cos(animTime2 * 0.03 - seed * 0.95) * 0.8 + sin(animTime3 * 0.027) * 0.15,
          sin(animTime1 * 0.06 - seed * 0.75) * 0.9 + cos(animTime2 * 0.019) * 0.1
        );
        
        // Fast erratic directions with chaotic components
        vec2 fastErraticDir1 = vec2(
          sin(animTime3 * 1.2 + cos(chaosTime * 0.7) * 0.6) * 0.3,
          cos(animTime1 * 1.4 + sin(chaosTime * 0.9) * 0.7) * 0.3
        );
        
        vec2 fastErraticDir2 = vec2(
          cos(animTime2 * 1.6 - sin(chaosTime * 1.1) * 0.5) * 0.35, 
          sin(animTime3 * 1.3 - cos(chaosTime * 0.8) * 0.6) * 0.25
        );
        
        // NEW: Create non-uniform rotation effects
        float rotationAngle1 = sin(animTime1 * 0.1) * 0.4 + animTime2 * 0.05;
        float rotationAngle2 = cos(animTime3 * 0.08) * 0.3 + animTime1 * 0.04;
        vec2 rotatedUV1 = rotate(uv, rotationAngle1);
        vec2 rotatedUV2 = rotate(uv, rotationAngle2);
        
        // NEW: Create varying complexity based on time for more evolution
        float varyingComplexity = complexity * (1.0 + sin(animTime1 * 0.05) * 0.2);
        
        // NEW: Use fractal noise with varying octaves for more natural randomness
        float largeSlowWave1 = fractalNoise(
          vec2(
            uv.x * 0.4 * varyingComplexity + slowWaveDir1.x * animTime1 * 0.04,
            uv.y * 0.5 * varyingComplexity + slowWaveDir1.y * animTime3 * 0.04
          ), 
          complexity, 
          seed + animTime * 0.002, 
          3
        ) * 0.6;
        
        float largeSlowWave2 = fractalNoise(
          vec2(
            uv.x * 0.3 * varyingComplexity + slowWaveDir2.x * animTime2 * 0.03,
            uv.y * 0.6 * varyingComplexity + slowWaveDir2.y * animTime1 * 0.03
          ), 
          complexity, 
          seed + 2.76 + animTime * 0.003, 
          4
        ) * 0.45;
        
        // Combine slow waves with varying weights based on time
        float timeVaryingWeight = sin(animTime2 * 0.023) * 0.2 + 0.5;
        float largeSlowWave = mix(largeSlowWave1, largeSlowWave2, timeVaryingWeight);
        
        // Primary medium-sized flows with fractal noise and chaotic timing
        float primaryFlow1 = fractalNoise(
          vec2(
            rotatedUV1.x * 0.9 * varyingComplexity + flowPrimary1.x * animTime3 * 0.2,
            rotatedUV1.y * 1.1 * varyingComplexity + flowPrimary1.y * animTime2 * 0.2
          ), 
          complexity, 
          seed + 1.43 + chaosTime * 0.001, 
          3
        ) * 0.5;
        
        float primaryFlow2 = fractalNoise(
          vec2(
            rotatedUV2.x * 1.0 * varyingComplexity + flowPrimary2.x * animTime1 * 0.15,
            rotatedUV2.y * 0.8 * varyingComplexity + flowPrimary2.y * animTime3 * 0.15
          ), 
          complexity, 
          seed + 5.31 + chaosTime * 0.002, 
          4
        ) * 0.45;
        
        // NEW: Add occasional turbulent bursts
        float burstFactor = pow(sin(animTime1 * 0.47) * 0.5 + 0.5, 3.0) * sin(animTime2 * 0.53) * 0.5 + 0.5;
        float turbulentBurst = fractalNoise(
          vec2(
            uv.x * 4.0 * varyingComplexity + sin(chaosTime * 0.3) * 2.0,
            uv.y * 4.0 * varyingComplexity + cos(chaosTime * 0.4) * 2.0
          ),
          complexity,
          seed + 7.89 + animTime3 * 0.01,
          2
        ) * burstFactor * 0.4;
        
        // Base noise with fractal variations
        float baseNoise = fractalNoise(
          vec2(
            uv.x * 1.2 * varyingComplexity + flowDir1.x * animTime1 * 0.3,
            uv.y * 1.8 * varyingComplexity + flowDir1.y * animTime2 * 0.3
          ),
          complexity,
          seed + 3.21 + chaosTime * 0.004,
          3
        ) * 0.4;
        
        baseNoise += fractalNoise(
          vec2(
            uv.x * 3.4 * varyingComplexity + flowDir2.x * animTime3 * 0.35,
            uv.y * 4.6 * varyingComplexity + flowDir2.y * animTime1 * 0.35
          ),
          complexity,
          seed + 4.56 + chaosTime * 0.003,
          3
        ) * 0.3;
        
        baseNoise += fractalNoise(
          vec2(
            rotatedUV1.x * 6.8 * varyingComplexity + flowDir3.x * animTime2 * 0.4,
            rotatedUV1.y * 7.2 * varyingComplexity + flowDir3.y * animTime3 * 0.4
          ),
          complexity,
          seed + 6.78 + chaosTime * 0.005,
          2
        ) * 0.2;
        
        // Cross-flowing currents with time-varying influence
        float crossInfluence = sin(animTime1 * 0.061) * 0.25 + 0.5;
        float crossNoise1 = fractalNoise(
          vec2(
            rotatedUV2.x * 2.5 * varyingComplexity + crossFlow1.x * animTime3 * 0.25,
            rotatedUV2.y * 2.2 * varyingComplexity + crossFlow1.y * animTime2 * 0.25
          ),
          complexity,
          seed + 8.91 + chaosTime * 0.002,
          3
        ) * 0.35 * crossInfluence;
        
        float crossNoise2 = fractalNoise(
          vec2(
            uv.x * 3.8 * varyingComplexity + crossFlow2.x * animTime1 * 0.3,
            uv.y * 3.2 * varyingComplexity + crossFlow2.y * animTime3 * 0.3
          ),
          complexity,
          seed + 9.12 + chaosTime * 0.006,
          3
        ) * 0.3 * (1.0 - crossInfluence);
        
        // Small fast erratic movements with occasional rapid changes
        float erraticIntensity = 0.15 + pow(sin(animTime2 * 1.23) * 0.5 + 0.5, 4.0) * 0.2;
        float smallFastNoise1 = fractalNoise(
          vec2(
            uv.x * 12.0 * varyingComplexity + fastErraticDir1.x * animTime3 * 2.0,
            uv.y * 10.0 * varyingComplexity + fastErraticDir1.y * animTime1 * 2.0
          ),
          complexity,
          seed + 10.34 + chaosTime * 0.01,
          2
        ) * erraticIntensity;
        
        float smallFastNoise2 = fractalNoise(
          vec2(
            rotatedUV1.x * 14.0 * varyingComplexity + fastErraticDir2.x * animTime2 * 2.4,
            rotatedUV1.y * 13.0 * varyingComplexity + fastErraticDir2.y * animTime3 * 2.4
          ),
          complexity,
          seed + 11.56 + chaosTime * 0.02,
          2
        ) * erraticIntensity * 0.7;
        
        float smallFastNoise = smallFastNoise1 + smallFastNoise2;
        
        // Remaining noise layers with more variation and non-repeating patterns
        float noise2 = fractalNoise(
          vec2(
            rotatedUV2.x * 2.2 * varyingComplexity + flowDir2.y * animTime1 * 0.6,
            rotatedUV2.y * 3.0 * varyingComplexity + flowDir1.x * animTime3 * 0.6
          ),
          complexity,
          seed + 12.78 + chaosTime * 0.007,
          3
        ) * 0.35;
        
        float noise3 = fractalNoise(
          vec2(
            uv.x * 3.3 * varyingComplexity + flowDir1.y * animTime2 * 0.8,
            uv.y * 2.7 * varyingComplexity + flowDir3.x * animTime1 * 0.8
          ),
          complexity,
          seed + 13.91 + chaosTime * 0.008,
          3
        ) * 0.3;
        
        float noise4 = fractalNoise(
          vec2(
            rotatedUV1.x * 4.8 * varyingComplexity + flowDir3.x * animTime3 * 0.5,
            rotatedUV1.y * 4.5 * varyingComplexity + flowDir2.y * animTime2 * 0.5
          ),
          complexity,
          seed + 14.23 + chaosTime * 0.009,
          2
        ) * 0.25;
        
        // Additional turbulence with time-varying weights
        float turbWeight = cos(animTime1 * 0.073) * 0.2 + 0.7;
        float turbulence = fractalNoise(
          vec2(
            rotatedUV2.x * 5.0 * varyingComplexity + crossFlow1.x * animTime2 * 0.2,
            rotatedUV2.y * 5.0 * varyingComplexity + crossFlow2.y * animTime3 * 0.3
          ),
          complexity,
          seed + 15.67 + chaosTime * 0.003,
          3
        ) * 0.15 * turbWeight;
        
        // NEW: Time-varying weights for all elements
        float primaryWeight = (sin(animTime1 * 0.037) * 0.15 + 0.45) * (1.0 + burstFactor * 0.3);
        float secondaryWeight = (cos(animTime2 * 0.043) * 0.1 + 0.3) * (1.0 - burstFactor * 0.2);
        float detailWeight = (sin(animTime3 * 0.051) * 0.1 + 0.2) * (1.0 + crossInfluence * 0.2);
        
        // Combine all elements with time-varying weights and chaotic influences
        float primaryElement = largeSlowWave * 0.5 + primaryFlow1 * 0.3 + primaryFlow2 * 0.2 + turbulentBurst;
        float secondaryElement = baseNoise * 0.4 + crossNoise1 * 0.3 + crossNoise2 * 0.3;
        float detailElement = (noise2 + noise3 + noise4) * 0.4 + turbulence * 0.6;
        
        float combinedNoise = primaryElement * primaryWeight + 
                             secondaryElement * secondaryWeight + 
                             detailElement * detailWeight;
        
        // Add small fast noise with chaotic variation
        combinedNoise += smallFastNoise * (0.6 + burstFactor * 0.3);
        
        // NEW: Occasionally introduce completely different patterns
        float patternShift = pow(sin(animTime1 * 0.029 + animTime3 * 0.031), 10.0) * 0.5;
        if (patternShift > 0.2) {
          float altPattern = fractalNoise(
            vec2(
              uv.x * 3.0 * varyingComplexity + sin(chaosTime * 0.4) * 0.5,
              uv.y * 3.0 * varyingComplexity + cos(chaosTime * 0.3) * 0.5
            ),
            complexity,
            seed + 20.56 + animTime2 * 0.05,
            4
          ) * patternShift;
          
          combinedNoise = mix(combinedNoise, altPattern, patternShift * 0.5);
        }
        
        // Create smooth distance modification with chaotic influences
        float modifiedDist = mix(
          dist,
          pow(dist, 2.0 - sphereEffect + sin(animTime2 * 0.2) * 0.1 + largeSlowWave * 0.3 + turbulentBurst * 0.2),
          sphereEffect + turbulence * 0.2 + primaryFlow1 * 0.1 + patternShift * 0.3
        );

        // Use animTime for color transitions
        float colorTransition1 = sin(animTime * 0.6) * 0.5 + 0.5;
        float colorTransition2 = sin(animTime * 0.42 + 0.5) * 0.5 + 0.5;
        float colorTransition3 = sin(animTime * 0.3 + 1.3) * 0.5 + 0.5;
        
        // SINGLE declaration of colorTransition
        float colorTransition = colorTransition1 * 0.5 + colorTransition2 * 0.3 + colorTransition3 * 0.2;
        
        // Add movement to the transition
        colorTransition = mix(
          colorTransition,
          sin(animTime * 0.2 + uv.x + uv.y) * 0.5 + 0.5,
          turbulence * 0.3
        );
        
        // Generate color noise patterns with controlled speed
        float colorNoise1 = snoise(vec2(
          uv.x * 1.0 * complexity + flowDir1.x * animTime * 0.2 + seed * 0.07,
          uv.y * 1.0 * complexity + flowDir1.y * animTime * 0.2 + seed * 0.07
        )) * 0.5 + 0.5;
        
        float colorNoise2 = snoise(vec2(
          uv.x * 1.5 * complexity + flowDir2.x * animTime * 0.15 - seed * 0.05,
          uv.y * 1.5 * complexity + flowDir2.y * animTime * 0.15 - seed * 0.05
        )) * 0.5 + 0.5;
        
        float colorNoise3 = snoise(vec2(
          uv.x * 2.0 * complexity + flowDir3.x * animTime * 0.1 + seed * 0.03,
          uv.y * 2.0 * complexity + flowDir3.y * animTime * 0.1 + seed * 0.03
        )) * 0.5 + 0.5;
        
        float colorNoise4 = snoise(vec2(
          uv.x * 2.5 * complexity + flowDir1.y * animTime * 0.05 - seed * 0.04,
          uv.y * 2.5 * complexity + flowDir2.x * animTime * 0.05 - seed * 0.04
        )) * 0.5 + 0.5;
        
        float colorNoise5 = snoise(vec2(
          uv.x * 3.0 * complexity + sin(animTime * 0.1) * 0.1 + seed * 0.05,
          uv.y * 3.0 * complexity + cos(animTime * 0.1) * 0.1 + seed * 0.05
        )) * 0.5 + 0.5;
        
        // Use custom colors from uniforms
        vec3 darkGreen = mix(gradient1Start, gradient1End, 0.3);
        vec3 lightGreen = mix(gradient1End, vec3(1.0), 0.3);
        
        vec3 darkOrange = mix(gradient2Start, gradient2End, 0.3);
        vec3 lightOrange = mix(gradient2End, vec3(1.0), 0.3);
        
        vec3 darkSand = mix(gradient3Start, gradient3End, 0.3);
        vec3 lightSand = mix(gradient3End, vec3(1.0), 0.3);
        
        // Subtle time-based noise with animTime
        float timeNoiseGreen = snoise(vec2(animTime * 0.08, seed * 0.5)) * 0.1;
        float timeNoiseOrange = snoise(vec2(animTime * 0.06, seed * 0.7)) * 0.1;
        float timeNoiseSand = snoise(vec2(animTime * 0.04, seed * 0.9)) * 0.1;
        
        // Color differentiation factor
        float subtleFactor = 0.5;
        
        // Multi-layered color mixing
        vec3 greenLayer = mix(gradient1Start, darkGreen, mix(colorNoise1, colorNoise2, colorTransition * subtleFactor) + timeNoiseGreen);
        greenLayer = mix(greenLayer, gradient1End, mix(colorNoise2, colorNoise3, colorTransition * subtleFactor) + timeNoiseGreen);
        greenLayer = mix(greenLayer, lightGreen, mix(colorNoise3, colorNoise1, colorTransition * subtleFactor) + timeNoiseGreen);
        
        vec3 orangeLayer = mix(gradient2Start, darkOrange, mix(colorNoise2, colorNoise3, colorTransition * subtleFactor) + timeNoiseOrange);
        orangeLayer = mix(orangeLayer, gradient2End, mix(colorNoise3, colorNoise4, colorTransition * subtleFactor) + timeNoiseOrange);
        orangeLayer = mix(orangeLayer, lightOrange, mix(colorNoise4, colorNoise2, colorTransition * subtleFactor) + timeNoiseOrange);
        
        vec3 sandLayer = mix(gradient3Start, darkSand, mix(colorNoise3, colorNoise4, colorTransition * subtleFactor) + timeNoiseSand);
        sandLayer = mix(sandLayer, gradient3End, mix(colorNoise4, colorNoise5, colorTransition * subtleFactor) + timeNoiseSand);
        sandLayer = mix(sandLayer, lightSand, mix(colorNoise5, colorNoise3, colorTransition * subtleFactor) + timeNoiseSand);
        
        // Time-based mixing with animTime
        float timeBasedMix = sin(animTime * 0.2 + seed) * 0.2 + 0.5;
        
        // Color mixing
        vec3 color1 = mix(orangeLayer, sandLayer, 
          colorNoise1 * 0.4 + 
          colorNoise2 * 0.3 + 
          colorNoise5 * 0.1 +
          colorTransition * subtleFactor + 
          timeBasedMix * 0.1
        );
        
        vec3 finalColor = mix(color1, greenLayer, 
          colorNoise3 * 0.3 + 
          colorNoise4 * 0.2 + 
          colorNoise5 * 0.2 +
          (1.0 - colorTransition) * subtleFactor +
          (1.0 - timeBasedMix) * 0.15
        );
        
        // Apply color intensity
        finalColor = mix(vec3(0.5), finalColor, colorIntensity);
        
        // NEW: Create more chaotic grain patterns
        float grainTime1 = animTime1 * 0.05;
        float grainTime2 = animTime2 * 0.03;
        
        // Reduce grain bursts for more consistent, subtle effect
        float grainBurst = pow(sin(animTime1 * 0.37) * 0.5 + 0.5, 12.0) * 0.5;
        
        // Fine grain with higher frequency but lower amplitude
        float fineGrain = fractalNoise(
          uv * 800.0 + fastErraticDir1 * grainTime1 * 0.2, 
          1.0, 
          seed + 16.78 + chaosTime * 0.01, 
          2
        ) * 0.04 * grainAmount;
        
        // Medium grain with more subtle movement
        float mediumGrain = fractalNoise(
          rotatedUV1 * 400.0 + flowDir2 * grainTime2 * 0.1, 
          1.0, 
          seed + 17.91 + chaosTime * 0.01, 
          2
        ) * 0.03 * grainAmount;
        
        // We don't need large grain for microsoft.ai style
        // float largeGrain = fractalNoise(...) * 0.05 * grainAmount;
        
        // Create a more uniform grain with less chaotic variations
        float grainMask = 1.0 + (sin(animTime2 * 0.3) * 0.05);
        vec3 grain = vec3(max(fineGrain + mediumGrain, 0.0)) * grainMask;
        
        // Apply grain with a more subtle approach
        finalColor = mix(finalColor, finalColor + grain, 0.7);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Create a wider geometry that covers the entire view
    const geometry = new THREE.PlaneGeometry(10, 10, 256, 256); // Increased size to ensure coverage

    // Settings object with default values (no longer tied to GUI)
    const settings = {
      speed: 0.01, // Changed from 0.05 to 0.1
      complexity: 2,
      colorIntensity: 1.3,
      grainAmount: 9, // Changed from 2 to 9
      sphereEffect: 0.0,
      layerCompression: 0.0,
      gradient1Start: "#336622",
      gradient1End: "#52cc38",
      gradient2Start: "#b26608",
      gradient2End: "#ff8c19",
      gradient3Start: "#bfa659",
      gradient3End: "#fad98c"
    };

    // Initialize material with static settings
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            time: { value: 0.0 },
            seed: { value: Math.random() * 1000 },
            speed: { value: settings.speed },
            complexity: { value: settings.complexity },
            colorIntensity: { value: settings.colorIntensity },
            grainAmount: { value: settings.grainAmount },
            sphereEffect: { value: settings.sphereEffect },
            layerCompression: { value: settings.layerCompression },
            gradient1Start: { value: [0.2, 0.55, 0.1] },
            gradient1End: { value: [0.32, 0.8, 0.22] },
            gradient2Start: { value: [0.7, 0.4, 0.05] },
            gradient2End: { value: [1.0, 0.65, 0.15] },
            gradient3Start: { value: [0.75, 0.65, 0.35] },
            gradient3End: { value: [0.98, 0.85, 0.55] }
        },
        transparent: false,
        depthWrite: false,
        depthTest: false
    });

    // Update color uniforms from settings
    function updateColorUniform(name) {
      const rgb = hexToRgb(settings[name]);
      material.uniforms[name].value = [rgb.r, rgb.g, rgb.b];
    }

    // Set initial colors
    updateColorUniform('gradient1Start');
    updateColorUniform('gradient1End');
    updateColorUniform('gradient2Start');
    updateColorUniform('gradient2End');
    updateColorUniform('gradient3Start');
    updateColorUniform('gradient3End');

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // GUI creation
    const gui = new dat.GUI({ width: 300 });
    
    // Create folders for better organization
    const animationFolder = gui.addFolder('Animation');
    const effectsFolder = gui.addFolder('Effects');
    const colorsFolder = gui.addFolder('Colors');

    // Add export button to the main GUI
    gui.add({exportSettings: function() {
      exportCurrentSettings();
    }}, 'exportSettings').name('Export as HTML');

    // Add all your GUI controls here
    animationFolder.add(settings, 'speed', 0.0, 1.0, 0.01)
        .onChange(value => material.uniforms.speed.value = value);
    effectsFolder.add(settings, 'complexity', 0.1, 20.0, 0.1)
        .onChange(value => material.uniforms.complexity.value = value);
    effectsFolder.add(settings, 'colorIntensity', 0.0, 20.0, 0.1)
        .onChange(value => material.uniforms.colorIntensity.value = value);
    effectsFolder.add(settings, 'grainAmount', 0.0, 20.0, 0.1)
        .onChange(value => material.uniforms.grainAmount.value = value);
    effectsFolder.add(settings, 'sphereEffect', 0.0, 10.0, 0.1)
        .onChange(value => material.uniforms.sphereEffect.value = value);
    effectsFolder.add(settings, 'layerCompression', 0.0, 10.0, 0.1)
        .onChange(value => material.uniforms.layerCompression.value = value);

    // Color controls
    colorsFolder.addColor(settings, 'gradient1Start')
        .name('gradient1Start')
        .onChange(() => updateColorUniform('gradient1Start'));
    colorsFolder.addColor(settings, 'gradient1End')
        .name('gradient1End')
        .onChange(() => updateColorUniform('gradient1End'));
    colorsFolder.addColor(settings, 'gradient2Start')
        .name('gradient2Start')
        .onChange(() => updateColorUniform('gradient2Start'));
    colorsFolder.addColor(settings, 'gradient2End')
        .name('gradient2End')
        .onChange(() => updateColorUniform('gradient2End'));
    colorsFolder.addColor(settings, 'gradient3Start')
        .name('gradient3Start')
        .onChange(() => updateColorUniform('gradient3Start'));
    colorsFolder.addColor(settings, 'gradient3End')
        .name('gradient3End')
        .onChange(() => updateColorUniform('gradient3End'));

    // Open folders by default
    animationFolder.open();
    effectsFolder.open();
    colorsFolder.open();

    // Animation Loop - use consistent time based on seed
    const clock = new THREE.Clock();
    // Use the existing seed value instead of random for consistency
    const initialTime = material.uniforms.seed.value % 10; // Use modulo to keep it reasonable
    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime() + initialTime; // Add consistent offset
        mesh.material.uniforms.time.value = time;
        renderer.render(scene, camera);
    }
    animate();

    // Function to export current settings - moved inside the initialization block
    function exportCurrentSettings() {
      try {
        // Function to show notification
        function showNotification(message, success = true) {
          const notification = document.createElement('div');
          notification.textContent = message;
          notification.style.position = 'fixed';
          notification.style.left = '50%';
          notification.style.top = '20px';
          notification.style.transform = 'translateX(-50%)';
          notification.style.padding = '10px 20px';
          notification.style.backgroundColor = success ? '#4CAF50' : '#f44336';
          notification.style.color = 'white';
          notification.style.borderRadius = '4px';
          notification.style.zIndex = '1000';
          notification.style.fontFamily = 'Arial, sans-serif';
          notification.style.fontSize = '14px';
          document.body.appendChild(notification);
          
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
        }
        
        // Get current settings from settings object (now in scope)
        const currentSettings = {
          speed: settings.speed,
          complexity: settings.complexity,
          colorIntensity: settings.colorIntensity,
          grainAmount: settings.grainAmount,
          sphereEffect: settings.sphereEffect,
          layerCompression: settings.layerCompression
        };
        
        // Get the colors from the settings object
        const colors = {
          gradient1Start: hexToRgb(settings.gradient1Start),
          gradient1End: hexToRgb(settings.gradient1End),
          gradient2Start: hexToRgb(settings.gradient2Start),
          gradient2End: hexToRgb(settings.gradient2End),
          gradient3Start: hexToRgb(settings.gradient3Start),
          gradient3End: hexToRgb(settings.gradient3End)
        };
        
        // Build the complete HTML page
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebGL Gradient Background</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #webgl-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="webgl-container"></div>

  <script>
    // Create the scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Set size to cover the entire window
    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
    camera.position.z = 2;

    // Calculate viewport bounds based on camera FOV and position
    const fov = camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * camera.position.z;
    const width = height * camera.aspect;

    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    document.getElementById('webgl-container').appendChild(renderer.domElement);

    // Vertex Shader
    const vertexShader = \`
      uniform float time;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    \`;

    // Fragment Shader with stable animation speed
    const fragmentShader = \`
      uniform float time;
      uniform float seed;
      uniform float speed;
      uniform float complexity;
      uniform float colorIntensity;
      uniform float grainAmount;
      uniform float sphereEffect;
      uniform float layerCompression;
      uniform vec3 gradient1Start;
      uniform vec3 gradient1End;
      uniform vec3 gradient2Start;
      uniform vec3 gradient2End;
      uniform vec3 gradient3Start;
      uniform vec3 gradient3End;
      varying vec2 vUv;
      
      // Include noise functions from fragment shader
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
              + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                                dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // Add rotation function for static positioning
      vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        mat2 m = mat2(c, -s, s, c);
        return m * v;
      }
      
      // NEW: Add a pseudo-random function based on a seed value
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      // NEW: Add fractal noise function for more natural randomness
      float fractalNoise(vec2 uv, float complexity, float seed, int octaves) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        // Use different seeds for each octave for more variation
        for(int i = 0; i < octaves; i++) {
          if(i >= octaves) break; // Fix for some GPU compatibility
          value += amplitude * snoise(vec2(
            uv.x * frequency * complexity + seed * float(i) * 0.17,
            uv.y * frequency * complexity + seed * float(i) * 0.23
          ));
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
        
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= 1.4;
        float dist = length(uv);
        
        // NEW: Use prime number based timing to avoid repeating patterns
        // Use several different prime-based timescales for maximum variation
        float animTime = mod(time * speed + seed * 10.0, 1000.0);
        float animTime1 = mod(time * speed * 1.618033988749895 + seed * 7.3, 1000.0); // Golden ratio
        float animTime2 = mod(time * speed * 1.414213562373095 + seed * 3.7, 1000.0); // Square root of 2
        float animTime3 = mod(time * speed * 1.732050807568877 + seed * 5.2, 1000.0); // Square root of 3
        
        // NEW: Create a chaotic time variation based on noise
        float chaosTime = animTime + snoise(vec2(animTime * 0.01, seed)) * 10.0;
        
        // NEW: Use more irrational number relationships and varied seeds
        // Primary flow directions with non-repeating configurations
        vec2 flowPrimary1 = vec2(
          sin(animTime1 * 0.25 + seed * 1.1) * 0.6 + cos(animTime2 * 0.13) * 0.2,
          cos(animTime3 * 0.3 + seed * 0.7) * 0.6 + sin(animTime1 * 0.21) * 0.1
        );
        
        vec2 flowPrimary2 = vec2(
          cos(animTime2 * 0.15 - seed * 1.3) * 0.7 + sin(animTime3 * 0.19) * 0.15, 
          -sin(animTime1 * 0.2 - seed * 0.9) * 0.7 + cos(animTime2 * 0.11) * 0.2
        );
        
        // Secondary flow directions with chaotic variations
        vec2 flowDir1 = vec2(
          sin(animTime3 * 0.5 + seed * 1.4 + sin(chaosTime * 0.02) * 0.3) * 0.5,
          -cos(animTime2 * 0.45 + seed * 0.6 + cos(chaosTime * 0.03) * 0.2) * 0.5
        );
        
        vec2 flowDir2 = vec2(
          -cos(animTime1 * 0.4 - seed * 1.25) * 0.6 + sin(animTime3 * 0.17) * 0.2, 
          sin(animTime2 * 0.55 - seed * 0.35) * 0.4 + cos(animTime1 * 0.23) * 0.15
        );
        
        vec2 flowDir3 = vec2(
          sin(animTime2 * 0.6 + seed * 1.2 + cos(chaosTime * 0.04) * 0.25) * 0.4,
          cos(animTime1 * 0.35 + seed * 0.45 + sin(chaosTime * 0.05) * 0.3) * 0.6
        );
        
        // Cross-flowing currents with chaotic influences
        vec2 crossFlow1 = vec2(
          cos(animTime3 * 0.37 + seed * 0.92) * 0.5 + sin(chaosTime * 0.07) * 0.2, 
          sin(animTime1 * 0.28 + seed * 1.53) * 0.5 + cos(chaosTime * 0.06) * 0.1
        );
        
        vec2 crossFlow2 = vec2(
          -sin(animTime2 * 0.41 - seed * 1.31) * 0.4 + cos(chaosTime * 0.08) * 0.15,
          cos(animTime3 * 0.33 - seed * 0.42) * 0.6 + sin(chaosTime * 0.09) * 0.1
        );
        
        // Slow waves with long periods and chaotic variations
        vec2 slowWaveDir1 = vec2(
          sin(animTime1 * 0.05 + seed * 0.82) * 0.9 + cos(animTime2 * 0.023) * 0.1,
          cos(animTime3 * 0.04 + seed * 0.71) * 0.8 + sin(animTime1 * 0.017) * 0.15
        );
        
        vec2 slowWaveDir2 = vec2(
          cos(animTime2 * 0.03 - seed * 0.95) * 0.8 + sin(animTime3 * 0.027) * 0.15,
          sin(animTime1 * 0.06 - seed * 0.75) * 0.9 + cos(animTime2 * 0.019) * 0.1
        );
        
        // Fast erratic directions with chaotic components
        vec2 fastErraticDir1 = vec2(
          sin(animTime3 * 1.2 + cos(chaosTime * 0.7) * 0.6) * 0.3,
          cos(animTime1 * 1.4 + sin(chaosTime * 0.9) * 0.7) * 0.3
        );
        
        vec2 fastErraticDir2 = vec2(
          cos(animTime2 * 1.6 - sin(chaosTime * 1.1) * 0.5) * 0.35, 
          sin(animTime3 * 1.3 - cos(chaosTime * 0.8) * 0.6) * 0.25
        );
        
        // NEW: Create non-uniform rotation effects
        float rotationAngle1 = sin(animTime1 * 0.1) * 0.4 + animTime2 * 0.05;
        float rotationAngle2 = cos(animTime3 * 0.08) * 0.3 + animTime1 * 0.04;
        vec2 rotatedUV1 = rotate(uv, rotationAngle1);
        vec2 rotatedUV2 = rotate(uv, rotationAngle2);
        
        // NEW: Create varying complexity based on time for more evolution
        float varyingComplexity = complexity * (1.0 + sin(animTime1 * 0.05) * 0.2);
        
        // NEW: Use fractal noise with varying octaves for more natural randomness
        float largeSlowWave1 = fractalNoise(
          vec2(
            uv.x * 0.4 * varyingComplexity + slowWaveDir1.x * animTime1 * 0.04,
            uv.y * 0.5 * varyingComplexity + slowWaveDir1.y * animTime3 * 0.04
          ), 
          complexity, 
          seed + animTime * 0.002, 
          3
        ) * 0.6;
        
        float largeSlowWave2 = fractalNoise(
          vec2(
            uv.x * 0.3 * varyingComplexity + slowWaveDir2.x * animTime2 * 0.03,
            uv.y * 0.6 * varyingComplexity + slowWaveDir2.y * animTime1 * 0.03
          ), 
          complexity, 
          seed + 2.76 + animTime * 0.003, 
          4
        ) * 0.45;
        
        // Combine slow waves with varying weights based on time
        float timeVaryingWeight = sin(animTime2 * 0.023) * 0.2 + 0.5;
        float largeSlowWave = mix(largeSlowWave1, largeSlowWave2, timeVaryingWeight);
        
        // Primary medium-sized flows with fractal noise and chaotic timing
        float primaryFlow1 = fractalNoise(
          vec2(
            rotatedUV1.x * 0.9 * varyingComplexity + flowPrimary1.x * animTime3 * 0.2,
            rotatedUV1.y * 1.1 * varyingComplexity + flowPrimary1.y * animTime2 * 0.2
          ), 
          complexity, 
          seed + 1.43 + chaosTime * 0.001, 
          3
        ) * 0.5;
        
        float primaryFlow2 = fractalNoise(
          vec2(
            rotatedUV2.x * 1.0 * varyingComplexity + flowPrimary2.x * animTime1 * 0.15,
            rotatedUV2.y * 0.8 * varyingComplexity + flowPrimary2.y * animTime3 * 0.15
          ), 
          complexity, 
          seed + 5.31 + chaosTime * 0.002, 
          4
        ) * 0.45;
        
        // NEW: Add occasional turbulent bursts
        float burstFactor = pow(sin(animTime1 * 0.47) * 0.5 + 0.5, 3.0) * sin(animTime2 * 0.53) * 0.5 + 0.5;
        float turbulentBurst = fractalNoise(
          vec2(
            uv.x * 4.0 * varyingComplexity + sin(chaosTime * 0.3) * 2.0,
            uv.y * 4.0 * varyingComplexity + cos(chaosTime * 0.4) * 2.0
          ),
          complexity,
          seed + 7.89 + animTime3 * 0.01,
          2
        ) * burstFactor * 0.4;
        
        // Base noise with fractal variations
        float baseNoise = fractalNoise(
          vec2(
            uv.x * 1.2 * varyingComplexity + flowDir1.x * animTime1 * 0.3,
            uv.y * 1.8 * varyingComplexity + flowDir1.y * animTime2 * 0.3
          ),
          complexity,
          seed + 3.21 + chaosTime * 0.004,
          3
        ) * 0.4;
        
        baseNoise += fractalNoise(
          vec2(
            uv.x * 3.4 * varyingComplexity + flowDir2.x * animTime3 * 0.35,
            uv.y * 4.6 * varyingComplexity + flowDir2.y * animTime1 * 0.35
          ),
          complexity,
          seed + 4.56 + chaosTime * 0.003,
          3
        ) * 0.3;
        
        baseNoise += fractalNoise(
          vec2(
            rotatedUV1.x * 6.8 * varyingComplexity + flowDir3.x * animTime2 * 0.4,
            rotatedUV1.y * 7.2 * varyingComplexity + flowDir3.y * animTime3 * 0.4
          ),
          complexity,
          seed + 6.78 + chaosTime * 0.005,
          2
        ) * 0.2;
        
        // Cross-flowing currents with time-varying influence
        float crossInfluence = sin(animTime1 * 0.061) * 0.25 + 0.5;
        float crossNoise1 = fractalNoise(
          vec2(
            rotatedUV2.x * 2.5 * varyingComplexity + crossFlow1.x * animTime3 * 0.25,
            rotatedUV2.y * 2.2 * varyingComplexity + crossFlow1.y * animTime2 * 0.25
          ),
          complexity,
          seed + 8.91 + chaosTime * 0.002,
          3
        ) * 0.35 * crossInfluence;
        
        float crossNoise2 = fractalNoise(
          vec2(
            uv.x * 3.8 * varyingComplexity + crossFlow2.x * animTime1 * 0.3,
            uv.y * 3.2 * varyingComplexity + crossFlow2.y * animTime3 * 0.3
          ),
          complexity,
          seed + 9.12 + chaosTime * 0.006,
          3
        ) * 0.3 * (1.0 - crossInfluence);
        
        // Small fast erratic movements with occasional rapid changes
        float erraticIntensity = 0.15 + pow(sin(animTime2 * 1.23) * 0.5 + 0.5, 4.0) * 0.2;
        float smallFastNoise1 = fractalNoise(
          vec2(
            uv.x * 12.0 * varyingComplexity + fastErraticDir1.x * animTime3 * 2.0,
            uv.y * 10.0 * varyingComplexity + fastErraticDir1.y * animTime1 * 2.0
          ),
          complexity,
          seed + 10.34 + chaosTime * 0.01,
          2
        ) * erraticIntensity;
        
        float smallFastNoise2 = fractalNoise(
          vec2(
            rotatedUV1.x * 14.0 * varyingComplexity + fastErraticDir2.x * animTime2 * 2.4,
            rotatedUV1.y * 13.0 * varyingComplexity + fastErraticDir2.y * animTime3 * 2.4
          ),
          complexity,
          seed + 11.56 + chaosTime * 0.02,
          2
        ) * erraticIntensity * 0.7;
        
        float smallFastNoise = smallFastNoise1 + smallFastNoise2;
        
        // Remaining noise layers with more variation and non-repeating patterns
        float noise2 = fractalNoise(
          vec2(
            rotatedUV2.x * 2.2 * varyingComplexity + flowDir2.y * animTime1 * 0.6,
            rotatedUV2.y * 3.0 * varyingComplexity + flowDir1.x * animTime3 * 0.6
          ),
          complexity,
          seed + 12.78 + chaosTime * 0.007,
          3
        ) * 0.35;
        
        float noise3 = fractalNoise(
          vec2(
            uv.x * 3.3 * varyingComplexity + flowDir1.y * animTime2 * 0.8,
            uv.y * 2.7 * varyingComplexity + flowDir3.x * animTime1 * 0.8
          ),
          complexity,
          seed + 13.91 + chaosTime * 0.008,
          3
        ) * 0.3;
        
        float noise4 = fractalNoise(
          vec2(
            rotatedUV1.x * 4.8 * varyingComplexity + flowDir3.x * animTime3 * 0.5,
            rotatedUV1.y * 4.5 * varyingComplexity + flowDir2.y * animTime2 * 0.5
          ),
          complexity,
          seed + 14.23 + chaosTime * 0.009,
          2
        ) * 0.25;
        
        // Additional turbulence with time-varying weights
        float turbWeight = cos(animTime1 * 0.073) * 0.2 + 0.7;
        float turbulence = fractalNoise(
          vec2(
            rotatedUV2.x * 5.0 * varyingComplexity + crossFlow1.x * animTime2 * 0.2,
            rotatedUV2.y * 5.0 * varyingComplexity + crossFlow2.y * animTime3 * 0.3
          ),
          complexity,
          seed + 15.67 + chaosTime * 0.003,
          3
        ) * 0.15 * turbWeight;
        
        // NEW: Time-varying weights for all elements
        float primaryWeight = (sin(animTime1 * 0.037) * 0.15 + 0.45) * (1.0 + burstFactor * 0.3);
        float secondaryWeight = (cos(animTime2 * 0.043) * 0.1 + 0.3) * (1.0 - burstFactor * 0.2);
        float detailWeight = (sin(animTime3 * 0.051) * 0.1 + 0.2) * (1.0 + crossInfluence * 0.2);
        
        // Combine all elements with time-varying weights and chaotic influences
        float primaryElement = largeSlowWave * 0.5 + primaryFlow1 * 0.3 + primaryFlow2 * 0.2 + turbulentBurst;
        float secondaryElement = baseNoise * 0.4 + crossNoise1 * 0.3 + crossNoise2 * 0.3;
        float detailElement = (noise2 + noise3 + noise4) * 0.4 + turbulence * 0.6;
        
        float combinedNoise = primaryElement * primaryWeight + 
                             secondaryElement * secondaryWeight + 
                             detailElement * detailWeight;
        
        // Add small fast noise with chaotic variation
        combinedNoise += smallFastNoise * (0.6 + burstFactor * 0.3);
        
        // NEW: Occasionally introduce completely different patterns
        float patternShift = pow(sin(animTime1 * 0.029 + animTime3 * 0.031), 10.0) * 0.5;
        if (patternShift > 0.2) {
          float altPattern = fractalNoise(
            vec2(
              uv.x * 3.0 * varyingComplexity + sin(chaosTime * 0.4) * 0.5,
              uv.y * 3.0 * varyingComplexity + cos(chaosTime * 0.3) * 0.5
            ),
            complexity,
            seed + 20.56 + animTime2 * 0.05,
            4
          ) * patternShift;
          
          combinedNoise = mix(combinedNoise, altPattern, patternShift * 0.5);
        }
        
        // Create smooth distance modification with chaotic influences
        float modifiedDist = mix(
          dist,
          pow(dist, 2.0 - sphereEffect + sin(animTime2 * 0.2) * 0.1 + largeSlowWave * 0.3 + turbulentBurst * 0.2),
          sphereEffect + turbulence * 0.2 + primaryFlow1 * 0.1 + patternShift * 0.3
        );

        // Use animTime for color transitions
        float colorTransition1 = sin(animTime * 0.6) * 0.5 + 0.5;
        float colorTransition2 = sin(animTime * 0.42 + 0.5) * 0.5 + 0.5;
        float colorTransition3 = sin(animTime * 0.3 + 1.3) * 0.5 + 0.5;
        
        // SINGLE declaration of colorTransition
        float colorTransition = colorTransition1 * 0.5 + colorTransition2 * 0.3 + colorTransition3 * 0.2;
        
        // Add movement to the transition
        colorTransition = mix(
          colorTransition,
          sin(animTime * 0.2 + uv.x + uv.y) * 0.5 + 0.5,
          turbulence * 0.3
        );
        
        // Generate color noise patterns with controlled speed
        float colorNoise1 = snoise(vec2(
          uv.x * 1.0 * complexity + flowDir1.x * animTime * 0.2 + seed * 0.07,
          uv.y * 1.0 * complexity + flowDir1.y * animTime * 0.2 + seed * 0.07
        )) * 0.5 + 0.5;
        
        float colorNoise2 = snoise(vec2(
          uv.x * 1.5 * complexity + flowDir2.x * animTime * 0.15 - seed * 0.05,
          uv.y * 1.5 * complexity + flowDir2.y * animTime * 0.15 - seed * 0.05
        )) * 0.5 + 0.5;
        
        float colorNoise3 = snoise(vec2(
          uv.x * 2.0 * complexity + flowDir3.x * animTime * 0.1 + seed * 0.03,
          uv.y * 2.0 * complexity + flowDir3.y * animTime * 0.1 + seed * 0.03
        )) * 0.5 + 0.5;
        
        float colorNoise4 = snoise(vec2(
          uv.x * 2.5 * complexity + flowDir1.y * animTime * 0.05 - seed * 0.04,
          uv.y * 2.5 * complexity + flowDir2.x * animTime * 0.05 - seed * 0.04
        )) * 0.5 + 0.5;
        
        float colorNoise5 = snoise(vec2(
          uv.x * 3.0 * complexity + sin(animTime * 0.1) * 0.1 + seed * 0.05,
          uv.y * 3.0 * complexity + cos(animTime * 0.1) * 0.1 + seed * 0.05
        )) * 0.5 + 0.5;
        
        // Use custom colors from uniforms
        vec3 darkGreen = mix(gradient1Start, gradient1End, 0.3);
        vec3 lightGreen = mix(gradient1End, vec3(1.0), 0.3);
        
        vec3 darkOrange = mix(gradient2Start, gradient2End, 0.3);
        vec3 lightOrange = mix(gradient2End, vec3(1.0), 0.3);
        
        vec3 darkSand = mix(gradient3Start, gradient3End, 0.3);
        vec3 lightSand = mix(gradient3End, vec3(1.0), 0.3);
        
        // Subtle time-based noise with animTime
        float timeNoiseGreen = snoise(vec2(animTime * 0.08, seed * 0.5)) * 0.1;
        float timeNoiseOrange = snoise(vec2(animTime * 0.06, seed * 0.7)) * 0.1;
        float timeNoiseSand = snoise(vec2(animTime * 0.04, seed * 0.9)) * 0.1;
        
        // Color differentiation factor
        float subtleFactor = 0.5;
        
        // Multi-layered color mixing
        vec3 greenLayer = mix(gradient1Start, darkGreen, mix(colorNoise1, colorNoise2, colorTransition * subtleFactor) + timeNoiseGreen);
        greenLayer = mix(greenLayer, gradient1End, mix(colorNoise2, colorNoise3, colorTransition * subtleFactor) + timeNoiseGreen);
        greenLayer = mix(greenLayer, lightGreen, mix(colorNoise3, colorNoise1, colorTransition * subtleFactor) + timeNoiseGreen);
        
        vec3 orangeLayer = mix(gradient2Start, darkOrange, mix(colorNoise2, colorNoise3, colorTransition * subtleFactor) + timeNoiseOrange);
        orangeLayer = mix(orangeLayer, gradient2End, mix(colorNoise3, colorNoise4, colorTransition * subtleFactor) + timeNoiseOrange);
        orangeLayer = mix(orangeLayer, lightOrange, mix(colorNoise4, colorNoise2, colorTransition * subtleFactor) + timeNoiseOrange);
        
        vec3 sandLayer = mix(gradient3Start, darkSand, mix(colorNoise3, colorNoise4, colorTransition * subtleFactor) + timeNoiseSand);
        sandLayer = mix(sandLayer, gradient3End, mix(colorNoise4, colorNoise5, colorTransition * subtleFactor) + timeNoiseSand);
        sandLayer = mix(sandLayer, lightSand, mix(colorNoise5, colorNoise3, colorTransition * subtleFactor) + timeNoiseSand);
        
        // Time-based mixing with animTime
        float timeBasedMix = sin(animTime * 0.2 + seed) * 0.2 + 0.5;
        
        // Color mixing
        vec3 color1 = mix(orangeLayer, sandLayer, 
          colorNoise1 * 0.4 + 
          colorNoise2 * 0.3 + 
          colorNoise5 * 0.1 +
          colorTransition * subtleFactor + 
          timeBasedMix * 0.1
        );
        
        vec3 finalColor = mix(color1, greenLayer, 
          colorNoise3 * 0.3 + 
          colorNoise4 * 0.2 + 
          colorNoise5 * 0.2 +
          (1.0 - colorTransition) * subtleFactor +
          (1.0 - timeBasedMix) * 0.15
        );
        
        // Apply color intensity
        finalColor = mix(vec3(0.5), finalColor, colorIntensity);
        
        // NEW: Create more chaotic grain patterns
        float grainTime1 = animTime1 * 0.05;
        float grainTime2 = animTime2 * 0.03;
        
        // Reduce grain bursts for more consistent, subtle effect
        float grainBurst = pow(sin(animTime1 * 0.37) * 0.5 + 0.5, 12.0) * 0.5;
        
        // Fine grain with higher frequency but lower amplitude
        float fineGrain = fractalNoise(
          uv * 800.0 + fastErraticDir1 * grainTime1 * 0.2, 
          1.0, 
          seed + 16.78 + chaosTime * 0.01, 
          2
        ) * 0.04 * grainAmount;
        
        // Medium grain with more subtle movement
        float mediumGrain = fractalNoise(
          rotatedUV1 * 400.0 + flowDir2 * grainTime2 * 0.1, 
          1.0, 
          seed + 17.91 + chaosTime * 0.01, 
          2
        ) * 0.03 * grainAmount;
        
        // We don't need large grain for microsoft.ai style
        // float largeGrain = fractalNoise(...) * 0.05 * grainAmount;
        
        // Create a more uniform grain with less chaotic variations
        float grainMask = 1.0 + (sin(animTime2 * 0.3) * 0.05);
        vec3 grain = vec3(max(fineGrain + mediumGrain, 0.0)) * grainMask;
        
        // Apply grain with a more subtle approach
        finalColor = mix(finalColor, finalColor + grain, 0.7);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    \`;

    // Create a wider geometry that covers the entire view
    const geometry = new THREE.PlaneGeometry(10, 10, 256, 256); // Increased size to ensure coverage

    // Use exported settings (applied from GUI)
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
      uniforms: {
        time: { value: 0.0 },
            seed: { value: Math.random() * 1000 },
            speed: { value: ${currentSettings.speed} },
            complexity: { value: ${currentSettings.complexity} },
            colorIntensity: { value: ${currentSettings.colorIntensity} },
            grainAmount: { value: ${currentSettings.grainAmount} },
            sphereEffect: { value: ${currentSettings.sphereEffect} },
            layerCompression: { value: ${currentSettings.layerCompression} },
            gradient1Start: { value: [${colors.gradient1Start.r}, ${colors.gradient1Start.g}, ${colors.gradient1Start.b}] },
            gradient1End: { value: [${colors.gradient1End.r}, ${colors.gradient1End.g}, ${colors.gradient1End.b}] },
            gradient2Start: { value: [${colors.gradient2Start.r}, ${colors.gradient2Start.g}, ${colors.gradient2Start.b}] },
            gradient2End: { value: [${colors.gradient2End.r}, ${colors.gradient2End.g}, ${colors.gradient2End.b}] },
            gradient3Start: { value: [${colors.gradient3Start.r}, ${colors.gradient3Start.g}, ${colors.gradient3Start.b}] },
            gradient3End: { value: [${colors.gradient3End.r}, ${colors.gradient3End.g}, ${colors.gradient3End.b}] }
        },
        transparent: false,
        depthWrite: false,
        depthTest: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation Loop
    const clock = new THREE.Clock();
    // Use the existing seed value instead of random for consistency
    const initialTime = material.uniforms.seed.value % 10; // Use modulo to keep it reasonable
    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime() + initialTime; // Add consistent offset
        mesh.material.uniforms.time.value = time;
        renderer.render(scene, camera);
    }
    animate();

    // Handle Window Resizing
    window.addEventListener("resize", () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(newWidth, newHeight);
    });
  </script>
</body>
</html>`;
        
        // Try to use the modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(htmlContent)
            .then(() => {
              showNotification('HTML copied to clipboard!');
              console.log('HTML content copied to clipboard!');
            })
            .catch(err => {
              console.error('Failed to copy:', err);
              showNotification('Failed to copy to clipboard. See console for HTML.', false);
              // Log content to console as backup
              console.log('HTML Content:');
              console.log(htmlContent);
            });
        } else {
          // Fallback for browsers without clipboard API
          try {
            const textArea = document.createElement('textarea');
            textArea.value = htmlContent;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            if (successful) {
              showNotification('HTML copied to clipboard!');
              console.log('HTML content copied to clipboard!');
            } else {
              showNotification('Failed to copy to clipboard. See console for HTML.', false);
              console.log('HTML Content:');
              console.log(htmlContent);
            }
            
            document.body.removeChild(textArea);
          } catch (err) {
            console.error('Failed to copy:', err);
            showNotification('Failed to copy to clipboard. See console for HTML.', false);
            console.log('HTML Content:');
            console.log(htmlContent);
          }
        }
        
      } catch (error) {
        console.error('Error in exportCurrentSettings:', error);
        alert('Error: ' + error.message);
      }
      
      return 'Attempted to copy HTML to clipboard';
    }
}

// Convert hex to RGB for shader
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : {r: 0, g: 0, b: 0};
}

// Handle Window Resizing
window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
});