"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export default function ThreeCanvas() {
  const mountRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const canvas = mountRef.current;
    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let gltfModel: THREE.Group;
    let modelPivot: THREE.Group;
    let mixer: THREE.AnimationMixer | null = null;
    let composer: EffectComposer | null = null;
    let useComposer = false;
    const clock = new THREE.Clock();

    let currentScroll = 0;
    let targetScroll = 0;
    let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
    let cursorX = window.innerWidth / 2, cursorY = window.innerHeight / 2;
    let outerCursorX = window.innerWidth / 2, outerCursorY = window.innerHeight / 2;

    const sparkCount = 450;
    const sparkData: Array<{
      speedX: number;
      speedY: number;
      speedZ: number;
      swaySpeed: number;
      swayRadius: number;
      phase: number;
    }> = [];
    let sparkParticles: THREE.Group;

    const shaderUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 }
    };

    const sizes = { width: window.innerWidth, height: window.innerHeight };

    // Initialize WebGL Scene
    function initScene() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color("#000000");
      scene.fog = new THREE.FogExp2("#000000", 0.01);

      camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
      camera.position.set(0, 0.2, 3.0);
      scene.add(camera);

      // Create Background wave shader
      createBackgroundShader();

      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 2.2;

      // Lights Setup
      const ambientLight = new THREE.AmbientLight("#ffffff", 0.1);
      scene.add(ambientLight);

      const keyLight = new THREE.SpotLight("#ffffff", 18.0);
      keyLight.position.set(4, 6, 3);
      keyLight.angle = Math.PI / 4;
      keyLight.penumbra = 0.9;
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 1.0;
      keyLight.shadow.camera.far = 15;
      keyLight.shadow.bias = -0.001;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight("#e3f2ff", 10.0);
      rimLight.position.set(-5, 3, -4);
      scene.add(rimLight);

      const fillLight = new THREE.DirectionalLight("#fff3e6", 0.8);
      fillLight.position.set(-2, -4, 2);
      scene.add(fillLight);

      // Post Processing Setup
      try {
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          0.18,  // strength
          0.12,  // radius
          0.88   // threshold
        );
        composer.addPass(bloomPass);

        // Chromatic Aberration Shader Pass
        const ChromaticAberrationShader = {
          uniforms: {
            "tDiffuse": { value: null },
            "uAmount": { value: 0.0012 }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uAmount;
            varying vec2 vUv;
            void main() {
              vec2 uv = vUv;
              float r = texture2D(tDiffuse, uv - vec2(uAmount, 0.0)).r;
              float g = texture2D(tDiffuse, uv).g;
              float b = texture2D(tDiffuse, uv + vec2(uAmount, 0.0)).b;
              gl_FragColor = vec4(r, g, b, 1.0);
            }
          `
        };
        const chromAberPass = new ShaderPass(ChromaticAberrationShader);
        composer.addPass(chromAberPass);

        // FXAA Pass
        const fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = renderer.getPixelRatio();
        fxaaPass.uniforms['resolution'].value.set(
          1 / (sizes.width * pixelRatio),
          1 / (sizes.height * pixelRatio)
        );
        composer.addPass(fxaaPass);

        useComposer = true;
      } catch (err) {
        console.warn("Postprocessing initialization failed, falling back to standard renderer:", err);
        useComposer = false;
      }

      createSparks();
      loadModel();
    }

    // Liquid-Bronze/Sapphire background wave shader
    function createBackgroundShader() {
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uScroll;

        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        float noise(in vec3 x) {
          vec3 p = floor(x);
          vec3 f = fract(x);
          f = f*f*(3.0-2.0*f);
          float n = p.x + p.y*57.0 + 113.0*p.z;
          return mix(mix(mix(hash(n+  0.0), hash(n+  1.0), f.x),
                         mix(hash(n+ 57.0), hash(n+ 58.0), f.x), f.y),
                     mix(mix(hash(n+113.0), hash(n+114.0), f.x),
                         mix(hash(n+170.0), hash(n+171.0), f.x), f.y), f.z);
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
          float aspect = uResolution.x / uResolution.y;
          float time = uTime * 0.08;
          float scroll = uScroll;
          
          float angle1 = 0.6;
          float angle2 = -0.7;
          float angle3 = 1.2;
          float freq1 = 2.4;
          float freq2 = 3.2;
          float freq3 = 4.0;
          
          vec2 warpedUv = uv;
          float scrollDeform = scroll * 5.0;
          
          warpedUv.x += sin(uv.y * 2.5 + time * 0.2 + scrollDeform) * 0.35;
          warpedUv.y += cos(uv.x * 2.5 - time * 0.15 - scrollDeform * 0.8) * 0.35;
          warpedUv.x += sin(uv.y * 1.2 - time * 0.1 - scrollDeform * 1.5) * 0.25;
          warpedUv.y += cos(uv.x * 1.2 + time * 0.18 + scrollDeform * 1.2) * 0.25;
          
          vec2 scrollDrift = vec2(scroll * 0.04, -scroll * 0.02);
          vec2 mouseShift = vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);
          warpedUv += scrollDrift + mouseShift;
          
          vec2 dir1 = vec2(cos(angle1), sin(angle1));
          vec2 dir2 = vec2(cos(angle2), sin(angle2));
          vec2 dir3 = vec2(cos(angle3), sin(angle3));
          
          float w1 = sin(dot(warpedUv, dir1) * freq1 + time * 1.0);
          float w2 = cos(dot(warpedUv, dir2) * freq2 - time * 1.4 + w1 * 0.4);
          float w3 = sin(dot(warpedUv, dir3) * freq3 + time * 1.8 + w2 * 0.5);
          
          float waveField = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;
          float wideSheen = pow(max(0.0, 1.0 - abs(waveField - 0.1)), 2.5);
          float crispSpecular = pow(max(0.0, 1.0 - abs(waveField - 0.15)), 8.0);
          float crest = wideSheen * 0.5 + crispSpecular * 0.9;
          
          vec3 c0_shadow = vec3(0.0010, 0.0006, 0.0004);
          vec3 c0_wave1  = vec3(0.085, 0.040, 0.015);
          vec3 c0_wave2  = vec3(0.050, 0.022, 0.008);
          vec3 c0_crest  = vec3(0.45, 0.30, 0.18);
          
          vec3 c1_shadow = vec3(0.0004, 0.0006, 0.0012);
          vec3 c1_wave1  = vec3(0.015, 0.035, 0.065);
          vec3 c1_wave2  = vec3(0.008, 0.020, 0.045);
          vec3 c1_crest  = vec3(0.18, 0.35, 0.55);
          
          float t = smoothstep(0.0, 1.0, scroll);
          vec3 colShadow = mix(c0_shadow, c1_shadow, t);
          vec3 colWave1  = mix(c0_wave1, c1_wave1, t);
          vec3 colWave2  = mix(c0_wave2, c1_wave2, t);
          vec3 colCrest  = mix(c0_crest, c1_crest, t);
          
          vec3 color = colShadow;
          color = mix(color, colWave2, smoothstep(-0.6, 0.2, waveField));
          color = mix(color, colWave1, smoothstep(0.0, 0.8, waveField));
          color += colCrest * crest * 1.4;
          
          float vignette = 1.0 - dot(uv, uv) * 0.12;
          color *= vignette;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const bgMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: shaderUniforms,
        depthWrite: false,
        depthTest: false
      });

      const bgGeometry = new THREE.PlaneGeometry(30, 30);
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
      bgMesh.position.set(0.0, 0.0, -8.0);
      bgMesh.renderOrder = -10;
      camera.add(bgMesh);
    }

    // Glowing Canvas Text Letter Particles
    function createLetterTexture(char: string) {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = 64;
      textureCanvas.height = 64;
      const ctx = textureCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.font = 'bold 44px "Outfit", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 165, 134, 0.8)"; // glowing peach/orange shadow
        ctx.fillStyle = "#ffffff";
        ctx.fillText(char, 32, 32);
      }
      return new THREE.CanvasTexture(textureCanvas);
    }

    // Spark Particles
    function createSparks() {
      const chars = ["A", "C", "E", "H", "M", "R", "S", "T", "W", "Z"];
      const pointsPerChar = Math.floor(sparkCount / chars.length);

      sparkParticles = new THREE.Group();
      scene.add(sparkParticles);

      for (let c = 0; c < chars.length; c++) {
        const char = chars[c];
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(pointsPerChar * 3);
        const colors = new Float32Array(pointsPerChar * 3);

        for (let i = 0; i < pointsPerChar; i++) {
          const idx = c * pointsPerChar + i;
          const x = (Math.random() - 0.5) * 6.5;
          const y = (Math.random() - 0.5) * 5.0 - 0.5;
          const z = (Math.random() - 0.5) * 6.5;
          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;

          if (Math.random() < 0.6) {
            // Orange Sparks
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.4 + Math.random() * 0.15;
            colors[i * 3 + 2] = 0.05 + Math.random() * 0.1;
          } else {
            // Blue Sparks
            colors[i * 3] = 0.55 + Math.random() * 0.15;
            colors[i * 3 + 1] = 0.82 + Math.random() * 0.12;
            colors[i * 3 + 2] = 1.0;
          }

          sparkData.push({
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: 0.15 + Math.random() * 0.3,
            speedZ: (Math.random() - 0.5) * 0.4,
            swaySpeed: 0.5 + Math.random() * 1.5,
            swayRadius: 0.05 + Math.random() * 0.15,
            phase: Math.random() * Math.PI * 2
          });
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
          size: 0.065,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          map: createLetterTexture(char)
        });

        const points = new THREE.Points(geometry, material);
        sparkParticles.add(points);
      }
    }

    // Load animated GLB running horse
    function loadModel() {
      const loader = new GLTFLoader();
      loader.load(
        "https://api.getlayers.ai/storage/v1/object/public/public/assets/laocoon-59f84455c6/bronze_horse.glb",
        (gltf) => {
          const model = gltf.scene;
          gltfModel = model;

          modelPivot = new THREE.Group();
          scene.add(modelPivot);
          modelPivot.add(model);

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (mesh.material) {
                const mat = mesh.material as THREE.MeshStandardMaterial;
                mat.roughness = 0.42;
                mat.metalness = 0.92;
                mat.flatShading = false;
                if (mat.map) {
                  mat.map.anisotropy = 16;
                }
              }
            }
          });

          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              mixer!.clipAction(clip).play();
            });
          }

          const boxInitial = new THREE.Box3().setFromObject(model);
          const sizeInitial = boxInitial.getSize(new THREE.Vector3());
          const maxDim = Math.max(sizeInitial.x, sizeInitial.y, sizeInitial.z);
          const targetScale = 3.5 / (maxDim > 0.0001 ? maxDim : 1);
          model.scale.setScalar(targetScale);

          model.updateMatrixWorld(true);

          const boxScaled = new THREE.Box3().setFromObject(model);
          const centerScaled = boxScaled.getCenter(new THREE.Vector3());
          model.position.sub(centerScaled);

          modelPivot.position.y = -0.4;
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    }

    // Window Resize Event
    function onWindowResize() {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      shaderUniforms.uResolution.value.set(sizes.width, sizes.height);

      if (useComposer && composer) {
        composer.setSize(sizes.width, sizes.height);
        const fxaaPass = composer.passes[composer.passes.length - 1] as ShaderPass;
        if (fxaaPass && fxaaPass.uniforms && fxaaPass.uniforms["resolution"]) {
          const pixelRatio = renderer.getPixelRatio();
          fxaaPass.uniforms["resolution"].value.set(
            1 / (sizes.width * pixelRatio),
            1 / (sizes.height * pixelRatio)
          );
        }
      }
    }

    // Scroll & Mouse Listeners
    function handleScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollTop = window.scrollY;
      targetScroll = maxScroll > 0 ? scrollTop / maxScroll : 0;
    }

    function handleMouseMove(event: MouseEvent) {
      cursorX = event.clientX;
      cursorY = event.clientY;

      const cursorInner = document.querySelector(".cursor-inner") as HTMLElement;
      if (cursorInner) {
        cursorInner.style.left = `${cursorX}px`;
        cursorInner.style.top = `${cursorY}px`;
      }

      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = (event.clientY / window.innerHeight) * 2 - 1;
    }

    // Main animation loop
    let animationFrameId: number;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      const deltaTime = clock.getDelta();
      if (mixer) mixer.update(deltaTime);

      currentScroll += (targetScroll - currentScroll) * 0.025;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      outerCursorX += (cursorX - outerCursorX) * 0.2;
      outerCursorY += (cursorY - outerCursorY) * 0.2;

      const cursorOuter = document.querySelector(".cursor-outer") as HTMLElement;
      if (cursorOuter) {
        cursorOuter.style.left = `${outerCursorX}px`;
        cursorOuter.style.top = `${outerCursorY}px`;
      }

      if (modelPivot) {
        const time = clock.getElapsedTime();
        const yRotationSpeed = (2 * Math.PI) / 25;

        modelPivot.rotation.y = time * yRotationSpeed + mouseX * 0.18;
        modelPivot.rotation.x = (3 * Math.PI / 180) * Math.sin(time * 0.4) + mouseY * 0.12;
        modelPivot.rotation.z = (1.5 * Math.PI / 180) * Math.cos(time * 0.5);
        modelPivot.position.y = -0.4 + Math.sin(time * (2 * Math.PI / 5.0)) * 0.08;
      }

      // Spark particles movement
      if (sparkParticles) {
        const time = clock.getElapsedTime();
        const scrollVelocity = Math.abs(targetScroll - currentScroll);
        const speedMultiplier = 1.0 + scrollVelocity * 9.0;
        const turbulence = scrollVelocity * 0.8;

        sparkParticles.children.forEach((pointsObj, charIdx) => {
          const points = pointsObj as THREE.Points;
          const positions = points.geometry.attributes.position.array as Float32Array;
          const pointsCount = positions.length / 3;

          for (let i = 0; i < pointsCount; i++) {
            const idx = i * 3;
            const globalIdx = charIdx * pointsCount + i;
            const data = sparkData[globalIdx];
            if (!data) continue;

            positions[idx] += data.speedX * deltaTime * speedMultiplier;
            positions[idx + 1] += data.speedY * deltaTime * speedMultiplier;
            positions[idx + 2] += data.speedZ * deltaTime * speedMultiplier;

            const currentSway = data.swayRadius * (1.0 + turbulence * 4.0);
            positions[idx] += Math.sin(time * data.swaySpeed + data.phase) * currentSway * deltaTime;
            positions[idx + 2] += Math.cos(time * data.swaySpeed + data.phase) * currentSway * deltaTime;

            if (
              positions[idx + 1] > 3.0 ||
              Math.abs(positions[idx]) > 3.5 ||
              Math.abs(positions[idx + 2]) > 3.5
            ) {
              positions[idx + 1] = -2.5;
              positions[idx] = (Math.random() - 0.5) * 3.0;
              positions[idx + 2] = (Math.random() - 0.5) * 3.0;
            }
          }
          points.geometry.attributes.position.needsUpdate = true;
        });
      }

      // Orbit camera setup
      const phi = currentScroll * Math.PI * 2.0;
      const y = 0.35 + Math.sin(currentScroll * Math.PI) * 0.8;
      const radius = 4.2 - Math.sin(currentScroll * Math.PI) * 0.6;
      const x = radius * Math.sin(phi);
      const z = radius * Math.cos(phi);

      const transitionProgress = Math.min(1.0, currentScroll / 0.28);
      const easeFactor = (Math.cos(transitionProgress * Math.PI) + 1.0) * 0.5;
      const lookAtXOffset = -0.9 * easeFactor;
      const targetLookAt = new THREE.Vector3(lookAtXOffset, -0.15, 0);
      const targetPos = new THREE.Vector3(x, y, z);
      camera.position.lerp(targetPos, 0.025);
      camera.lookAt(targetLookAt);

      shaderUniforms.uTime.value = clock.getElapsedTime();
      shaderUniforms.uMouse.value.set(mouseX, -mouseY);
      shaderUniforms.uScroll.value = currentScroll;

      // Update slide layout state (direct DOM selectors for speed)
      updateSlidesDOM(currentScroll);
      updateGridDotsDOM(currentScroll);

      if (useComposer && composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    }

    function updateGridDotsDOM(scroll: number) {
      const dots = document.querySelectorAll(".grid-dot");
      dots.forEach((dotNode, i) => {
        const dot = dotNode as HTMLElement;
        const startY = (i * 17) % 80 + 10;
        let speed = 90 + (i * 55) % 180;
        if (i % 2 === 0) speed = -speed;
        let yCoord = startY + scroll * speed;
        yCoord = ((yCoord % 100) + 100) % 100;
        dot.style.top = `${yCoord}%`;
      });
    }

    function updateSlidesDOM(scroll: number) {
      const slide1 = document.getElementById("slide-1");
      const slide2 = document.getElementById("slide-2");
      const slide3 = document.getElementById("slide-3");
      const slide4 = document.getElementById("slide-4");

      for (let i = 1; i <= 4; i++) {
        const fill = document.getElementById(`dash-fill-${i}`);
        if (fill) {
          const start = (i - 1) * 0.25;
          const end = i * 0.25;
          let progress = (scroll - start) / (end - start);
          progress = Math.max(0, Math.min(1, progress));
          fill.style.height = `${progress * 100}%`;
        }
      }

      const isActive = (val: number, start: number, end: number) => val >= start && val <= end;

      if (slide1) slide1.classList.toggle("active", isActive(scroll, -0.10, 0.12));
      if (slide2) {
        const active2 = isActive(scroll, 0.28, 0.40);
        slide2.classList.toggle("active", active2);
        const slide2Img = document.getElementById("slide-2-img");
        if (slide2Img) slide2Img.classList.toggle("active", active2);
      }
      if (slide3) slide3.classList.toggle("active", isActive(scroll, 0.56, 0.68));
      if (slide4) slide4.classList.toggle("active", isActive(scroll, 0.84, 1.05));
    }

    // Start everything
    initScene();
    animate();

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      if (renderer) renderer.dispose();
    };
  }, []);

  return <canvas id="webgl" ref={mountRef} />;
}
