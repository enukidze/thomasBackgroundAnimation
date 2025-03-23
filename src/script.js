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
        
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= 1.4;
        float dist = length(uv);
        
        // CHANGE: Use a larger modulo to prevent floating point precision issues
        // This ensures better numerical stability for long-running animations
        float animTime = mod(time * speed + seed * 10.0, 1000.0);
        
        // Create flowing directional movements with consistent speed
        vec2 flowDir1 = vec2(
          sin(animTime * 0.3 + seed * 0.5) * 0.5,
          cos(animTime * 0.4 + seed * 0.7) * 0.5
        );
        
        vec2 flowDir2 = vec2(
          cos(animTime * 0.2 - seed * 0.3) * 0.7,
          sin(animTime * 0.5 - seed * 0.2) * 0.3
        );
        
        vec2 flowDir3 = vec2(
          sin(animTime * 0.6 + seed * 0.4) * 0.4,
          cos(animTime * 0.3 + seed * 0.6) * 0.6
        );
        
        // Create flowing noise patterns with consistent speed
        float baseNoise = snoise(vec2(
          uv.x * 1.2 * complexity + flowDir1.x * animTime,
          uv.y * 1.8 * complexity + flowDir1.y * animTime
        )) * 0.4;
        
        baseNoise += snoise(vec2(
          uv.x * 3.4 * complexity + flowDir2.x * animTime * 0.7,
          uv.y * 4.6 * complexity + flowDir2.y * animTime * 0.7
        )) * 0.3;
        
        baseNoise += snoise(vec2(
          uv.x * 6.8 * complexity + flowDir3.x * animTime * 0.5,
          uv.y * 7.2 * complexity + flowDir3.y * animTime * 0.5
        )) * 0.2;
        
        float noise2 = snoise(vec2(
          uv.x * 2.2 * complexity + flowDir2.y * animTime * 0.6,
          uv.y * 3.0 * complexity + flowDir1.x * animTime * 0.6
        )) * 0.35;
        
        noise2 += snoise(vec2(
          uv.x * 5.4 * complexity + flowDir3.y * animTime * 0.4,
          uv.y * 6.0 * complexity + flowDir2.x * animTime * 0.4
        )) * 0.25;
        
        float noise3 = snoise(vec2(
          uv.x * 3.3 * complexity + flowDir1.y * animTime * 0.8,
          uv.y * 2.7 * complexity + flowDir3.x * animTime * 0.8
        )) * 0.3;
        
        noise3 += snoise(vec2(
          uv.x * 7.6 * complexity + flowDir2.y * animTime * 0.3,
          uv.y * 6.4 * complexity + flowDir1.x * animTime * 0.3
        )) * 0.2;
        
        float noise4 = snoise(vec2(
          uv.x * 4.8 * complexity + flowDir3.x * animTime * 0.5,
          uv.y * 4.5 * complexity + flowDir2.y * animTime * 0.5
        )) * 0.25;
        
        // Additional flow turbulence with consistent speed
        float turbulence = snoise(vec2(
          uv.x * 5.0 * complexity + flowDir1.x * animTime * 0.2,
          uv.y * 5.0 * complexity + flowDir2.y * animTime * 0.3
        )) * 0.15;
        
        // Combine noise with flow-based turbulence
        float combinedNoise = (baseNoise + noise2 + noise3 + noise4) * (1.0 + turbulence);
        
        // Create smooth distance modification
        float modifiedDist = mix(
          dist,
          pow(dist, 2.0 - sphereEffect + sin(animTime * 0.2) * 0.1),
          sphereEffect + turbulence * 0.2
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
        
        // Add flowing grain effect with animTime
        float fineGrain = snoise(uv * 400.0 + flowDir1 * animTime * 0.1) * 0.12 * grainAmount;
        float mediumGrain = snoise(uv * 200.0 + flowDir2 * animTime * 0.05) * 0.08 * grainAmount;
        float largeGrain = snoise(uv * 100.0 + flowDir3 * animTime * 0.03) * 0.05 * grainAmount;
        
        // Enhanced grain mask
        float grainMask = 1.0 + sin(animTime * 0.5 + turbulence) * 0.1;
        vec3 grain = vec3(max(fineGrain + mediumGrain + largeGrain, 0.0)) * grainMask;
        finalColor += grain;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Create a wider geometry that covers the entire view
    const geometry = new THREE.PlaneGeometry(10, 10, 256, 256); // Increased size to ensure coverage

    // Settings object with default values (no longer tied to GUI)
    const settings = {
      speed: 0.05,
      complexity: 2,
      colorIntensity: 1.3,
      grainAmount: 2,
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

    // Animation Loop - add initial offset to start animation immediately
    const clock = new THREE.Clock();
    const initialTime = Math.random() * 100; // Random starting time
    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime() + initialTime; // Add initial offset
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
        
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= 1.4;
        float dist = length(uv);
        
        // CHANGE: Use a larger modulo to prevent floating point precision issues
        // This ensures better numerical stability for long-running animations
        float animTime = mod(time * speed + seed * 10.0, 1000.0);
        
        // Create flowing directional movements with consistent speed
        vec2 flowDir1 = vec2(
          sin(animTime * 0.3 + seed * 0.5) * 0.5,
          cos(animTime * 0.4 + seed * 0.7) * 0.5
        );
        
        vec2 flowDir2 = vec2(
          cos(animTime * 0.2 - seed * 0.3) * 0.7,
          sin(animTime * 0.5 - seed * 0.2) * 0.3
        );
        
        vec2 flowDir3 = vec2(
          sin(animTime * 0.6 + seed * 0.4) * 0.4,
          cos(animTime * 0.3 + seed * 0.6) * 0.6
        );
        
        // Create flowing noise patterns with consistent speed
        float baseNoise = snoise(vec2(
          uv.x * 1.2 * complexity + flowDir1.x * animTime,
          uv.y * 1.8 * complexity + flowDir1.y * animTime
        )) * 0.4;
        
        baseNoise += snoise(vec2(
          uv.x * 3.4 * complexity + flowDir2.x * animTime * 0.7,
          uv.y * 4.6 * complexity + flowDir2.y * animTime * 0.7
        )) * 0.3;
        
        baseNoise += snoise(vec2(
          uv.x * 6.8 * complexity + flowDir3.x * animTime * 0.5,
          uv.y * 7.2 * complexity + flowDir3.y * animTime * 0.5
        )) * 0.2;
        
        float noise2 = snoise(vec2(
          uv.x * 2.2 * complexity + flowDir2.y * animTime * 0.6,
          uv.y * 3.0 * complexity + flowDir1.x * animTime * 0.6
        )) * 0.35;
        
        noise2 += snoise(vec2(
          uv.x * 5.4 * complexity + flowDir3.y * animTime * 0.4,
          uv.y * 6.0 * complexity + flowDir2.x * animTime * 0.4
        )) * 0.25;
        
        float noise3 = snoise(vec2(
          uv.x * 3.3 * complexity + flowDir1.y * animTime * 0.8,
          uv.y * 2.7 * complexity + flowDir3.x * animTime * 0.8
        )) * 0.3;
        
        noise3 += snoise(vec2(
          uv.x * 7.6 * complexity + flowDir2.y * animTime * 0.3,
          uv.y * 6.4 * complexity + flowDir1.x * animTime * 0.3
        )) * 0.2;
        
        float noise4 = snoise(vec2(
          uv.x * 4.8 * complexity + flowDir3.x * animTime * 0.5,
          uv.y * 4.5 * complexity + flowDir2.y * animTime * 0.5
        )) * 0.25;
        
        // Additional flow turbulence with consistent speed
        float turbulence = snoise(vec2(
          uv.x * 5.0 * complexity + flowDir1.x * animTime * 0.2,
          uv.y * 5.0 * complexity + flowDir2.y * animTime * 0.3
        )) * 0.15;
        
        // Combine noise with flow-based turbulence
        float combinedNoise = (baseNoise + noise2 + noise3 + noise4) * (1.0 + turbulence);
        
        // Create smooth distance modification
        float modifiedDist = mix(
          dist,
          pow(dist, 2.0 - sphereEffect + sin(animTime * 0.2) * 0.1),
          sphereEffect + turbulence * 0.2
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
        
        // Add flowing grain effect with animTime
        float fineGrain = snoise(uv * 400.0 + flowDir1 * animTime * 0.1) * 0.12 * grainAmount;
        float mediumGrain = snoise(uv * 200.0 + flowDir2 * animTime * 0.05) * 0.08 * grainAmount;
        float largeGrain = snoise(uv * 100.0 + flowDir3 * animTime * 0.03) * 0.05 * grainAmount;
        
        // Enhanced grain mask
        float grainMask = 1.0 + sin(animTime * 0.5 + turbulence) * 0.1;
        vec3 grain = vec3(max(fineGrain + mediumGrain + largeGrain, 0.0)) * grainMask;
        finalColor += grain;
        
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
    const initialTime = Math.random() * 100; // Random starting time
    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime() + initialTime; // Add initial offset
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