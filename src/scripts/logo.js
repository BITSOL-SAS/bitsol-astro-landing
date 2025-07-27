import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import model from '../assets/bitsol.glb';
import { gsap } from 'gsap';

export function initLogo(container) {
    if (!container) {
        console.error("Container for logo not found");
        return;
    }

    let moveLogo = false;
    let wireframe = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;

    const starCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < positions.length; i++) {
        positions[i] = (Math.random() - 0.5) * 2000;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const vertexShader = `
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 1.0; // Size of the dots
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White color
        }
    `;

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    const vertexShader_universe = `
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    // Fragment Shader
    const fragmentShader_universe = `
        uniform float time;
        uniform float seed;
        uniform vec2 resolution;

        // Simple hash function
        float hash(float n) { return fract(sin(n) * 43758.5453 * seed); }

        // 2D Noise function
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f*f*(3.0-2.0*f); // quintic smooth

            float a = hash(i.x + i.y*57.0);
            float b = hash(i.x+1.0 + i.y*57.0);
            float c = hash(i.x + (i.y+1.0)*57.0);
            float d = hash(i.x+1.0 + (i.y+1.0)*57.0);

            return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
        }

        // Fractal Brownian Motion for complexity
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            int octaves = 6;
            for(int i=0; i<octaves; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            uv.x *= resolution.x / resolution.y;

            vec2 uv_time_shifted = uv + vec2(time * 0.02, time * 0.005);

            // Generate nebula clouds using FBM
            float nebula_value = fbm(uv_time_shifted * 2.0);

            // Define subtle nebula colors
            vec3 deep_space_color = vec3(0.0, 0.0, 0.0);
            vec3 gas_color_1 = vec3(0.1, 0.1, 0.3); // Faint Blue/Purple
            vec3 gas_color_2 = vec3(0.2, 0.1, 0.2); // Faint Magenta/Red

            // Mix colors to create a more subtle nebula effect
            vec3 color = mix(deep_space_color, gas_color_1, smoothstep(0.4, 0.6, nebula_value));
            color = mix(color, gas_color_2, smoothstep(0.5, 0.7, nebula_value));

            // Add very sparse and faint stars
            float star_noise = noise(uv * 1200.0);
            float stars = smoothstep(0.99, 1.0, star_noise);
            
            vec3 final_color = color + stars * 0.3;

            gl_FragColor = vec4(final_color, 0.35);
        }
    `;

    // Shader Material
    const material_universe = new THREE.ShaderMaterial({
        vertexShader: vertexShader_universe,
        fragmentShader: fragmentShader_universe,
        uniforms: {
            time: { value: 1.0 },
            seed: { value: Math.random() },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        }
    });

    const geometry_universe = new THREE.PlaneGeometry(5000, 5000);
    const universe = new THREE.Mesh(geometry_universe, material_universe);
    universe.position.z = -100;
    // set opacity to .5 to universe
    universe.material.transparent = true;
    universe.material.opacity = 0.15;
    scene.add(universe);

    const gltfLoader = new GLTFLoader();
    let loadedModel = null;

    gltfLoader.load(model, function (gltf) {
        scene.add(gltf.scene);
        // save the model in a variable
        loadedModel = gltf;
        // scale the model
        gltf.scene.scale.set(7, 7, 7);
        // rotate the model
        gltf.scene.rotation.y = -1.5;
        gltf.scene.position.z = 50;
        gltf.scene.position.x = 0;

        // change to wireframe
        // start the of the model
        const mixer = new THREE.AnimationMixer(gltf.scene);

        // Animation loop
        const clock = new THREE.Clock();
        function animate_logo() {
            requestAnimationFrame(animate_logo);

            // Update the animation mixer on each frame
            const delta = clock.getDelta();
            mixer.update(delta);

            renderer.render(scene, camera);
        }

        // animate_logo(); // This is not needed as the main animate() calls render
    }, undefined, function (error) {
        console.error(error);
    });

    camera.position.z = 500;
    var gyroPresent = false;
    const mouse = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
        if (!gyroPresent) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }
    });

    // Set up device motion listener once
    window.addEventListener('devicemotion', (event) => {
        if (event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma) {
            gyroPresent = true;
            // This logic is now inside the animate loop
        }
    }, { once: true });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        if (!wireframe && loadedModel) {
            material_universe.uniforms.time.value = performance.now() / 1000;
        }

        // get mouse position

        // // if gyroscope is available on the device then rotate the camera based on the device orientation
        // window.addEventListener('devicemotion', (event) => {
        //     if (event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma) {
        //         gyroPresent = true;
        //         camera.position.y = event.rotationRate.alpha * Math.PI / 180;
        //         camera.position.x = event.rotationRate.beta * Math.PI / 180;
        //         // universe.lookAt(camera.position);
        //     }
        // });

        // if (!gyroPresent) {
        //     window.addEventListener('mousemove', (event) => {
        //         const mouse = new THREE.Vector2();
        //         mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        //         mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        //         camera.position.x = mouse.x * 100;
        //         camera.position.y = mouse.y * 100;

        //         // rotate the plane to face the camera
        //         // universe.lookAt(camera.position);
        //     });
        // }

        if (!wireframe && loadedModel) {
            material_universe.uniforms.time.value = performance.now() / 1000;
        }

        if (!gyroPresent) {
            camera.position.x += (mouse.x * 100 - camera.position.x) * 0.05;
            camera.position.y += (mouse.y * 100 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
        }

        if (moveLogo && loadedModel) {
            // loadedModel.scene.position.y += 10;
            // gsap.to(loadedModel.scene.position, { y: 220, duration: 1 });
            // rotate the logo
            gsap.to(loadedModel.scene.rotation, { y: -Math.PI * 2.5, duration: 1 });
        } else if (loadedModel) {
            // gsap.to(loadedModel.scene.position, { y: 50, duration: 1 });
            gsap.to(loadedModel.scene.rotation, { y: -1.5, duration: 1 });
        }

        if (wireframe && loadedModel) {
            loadedModel.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material.wireframe = true;
                }
            });
        } else if (loadedModel) {
            loadedModel.scene.traverse(function (child) {
                if (child.isMesh) {
                    child.material.wireframe = false;
                }
            });
        }


        renderer.render(scene, camera);
    }

    document.addEventListener('scroll', (event) => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        if (loadedModel) {
            // When the user has scrolled at least 100vh from the top
            if (scrollTop > window.innerHeight / 2) {
                gsap.to(loadedModel.scene.position, {
                    x: 0,
                    y: 300,
                    duration: 1
                });
                gsap.to(loadedModel.scene.scale, {
                    x: 2,
                    y: 2,
                    z: 2,
                    duration: 1
                });
                gsap.to(loadedModel.scene.rotation, {
                    y: loadedModel.scene.rotation.y + Math.PI * 2,
                    duration: 1
                });
            } else {
                gsap.to(loadedModel.scene.position, {
                    x: 0,
                    y: 0,
                    duration: 1
                });
                gsap.to(loadedModel.scene.scale, {
                    x: 7,
                    y: 7,
                    z: 7,
                    duration: 1
                });
                gsap.to(loadedModel.scene.rotation, {
                    y: -1.5,
                    duration: 1
                });
            }
        }
    }, true);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        material_universe.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    });

    animate();
}