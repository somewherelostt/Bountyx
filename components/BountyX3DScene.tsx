"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function BountyX3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const clusterRef = useRef<THREE.Group | null>(null);
  const cubesRef = useRef<
    Array<{
      mesh: THREE.Mesh | THREE.LineSegments;
      originalPos: THREE.Vector3;
      distance: number;
    }>
  >([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const mainLight = new THREE.PointLight(0x00ff00, 2, 100);
    mainLight.position.set(0, -10, 0);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const accentLight = new THREE.PointLight(0xff00ff, 1, 80);
    accentLight.position.set(20, 5, -20);
    scene.add(accentLight);

    const ambientLight = new THREE.AmbientLight(0x111111, 0.3);
    scene.add(ambientLight);

    // Grid floor
    const gridHelper = new THREE.GridHelper(100, 20, 0x00ff00, 0x111111);
    gridHelper.position.y = -15;
    scene.add(gridHelper);

    // Materials
    const blackMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.8,
    });

    const neonGreenMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      metalness: 0.2,
      roughness: 0.4,
    });

    const neonPinkMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.7,
      metalness: 0.2,
      roughness: 0.4,
    });

    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

    // Create cluster
    const cluster = new THREE.Group();
    scene.add(cluster);
    clusterRef.current = cluster;

    // Helper functions
    const createWireframeBox = (size: number) => {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const edges = new THREE.EdgesGeometry(geometry);
      return new THREE.LineSegments(edges, wireframeMaterial);
    };

    const createSolidBox = (
      width: number,
      height: number,
      depth: number,
      material: THREE.Material
    ) => {
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // Build cluster
    const cubes: Array<{
      mesh: THREE.Mesh | THREE.LineSegments;
      originalPos: THREE.Vector3;
      distance: number;
    }> = [];

    const coreCube = createSolidBox(6, 6, 6, neonGreenMaterial);
    coreCube.position.set(0, 0, 0);
    cluster.add(coreCube);
    cubes.push({
      mesh: coreCube,
      originalPos: coreCube.position.clone(),
      distance: 0,
    });

    const positions = [
      { pos: [10, 0, 0], size: 4 },
      { pos: [-10, 0, 0], size: 4 },
      { pos: [0, 10, 0], size: 4 },
      { pos: [0, -10, 0], size: 4 },
      { pos: [0, 0, 10], size: 4 },
      { pos: [0, 0, -10], size: 4 },
      { pos: [8, 8, 0], size: 3 },
      { pos: [-8, -8, 0], size: 3 },
      { pos: [0, 8, 8], size: 3 },
      { pos: [0, -8, -8], size: 3 },
    ];

    positions.forEach((p, idx) => {
      const material = idx % 3 === 0 ? neonPinkMaterial : blackMaterial;
      const cube = createSolidBox(p.size, p.size, p.size, material);
      cube.position.set(p.pos[0], p.pos[1], p.pos[2]);
      cluster.add(cube);
      cubes.push({
        mesh: cube,
        originalPos: cube.position.clone(),
        distance: Math.sqrt(p.pos[0] ** 2 + p.pos[1] ** 2 + p.pos[2] ** 2),
      });

      const wireframe = createWireframeBox(p.size);
      wireframe.position.copy(cube.position);
      cluster.add(wireframe);
    });

    // Girders
    const girderGeometry = new THREE.BufferGeometry();
    const girderPoints = [
      new THREE.Vector3(-15, 5, 0),
      new THREE.Vector3(15, 5, 0),
      new THREE.Vector3(0, -5, -15),
      new THREE.Vector3(0, -5, 15),
    ];
    girderGeometry.setFromPoints(girderPoints);
    const girderMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const girders = new THREE.LineSegments(girderGeometry, girderMaterial);
    cluster.add(girders);

    // Pyramid
    const pyramidGeometry = new THREE.ConeGeometry(5, 8, 4);
    const pyramidEdges = new THREE.EdgesGeometry(pyramidGeometry);
    const pyramidWireframe = new THREE.LineSegments(
      pyramidEdges,
      wireframeMaterial
    );
    pyramidWireframe.position.set(-12, 5, 12);
    cluster.add(pyramidWireframe);

    cubesRef.current = cubes;

    // Animation state
    let glitchTimer = 0;
    const glitchInterval = 6000;
    let isGlitching = false;
    let glitchStartTime = 0;
    let mouseX = 0;
    let mouseY = 0;

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now();
      glitchTimer += 16;

      // Ambient rotation
      cluster.rotation.y += 0.0003;

      // Wobble animation
      cubes.forEach((cube, idx) => {
        const wobble = Math.sin(time * 0.0005 + idx) * 0.5;
        const distance = cube.distance * 0.1;
        cube.mesh.position.copy(cube.originalPos);
        cube.mesh.position.addScaledVector(
          cube.originalPos.clone().normalize(),
          wobble * distance
        );
      });

      // Parallax
      camera.position.x += (mouseX * 8 - camera.position.x) * 0.05;
      camera.position.z += (25 + mouseY * 5 - camera.position.z) * 0.05;
      camera.lookAt(0, 0, 0);

      // Glitch
      if (glitchTimer > glitchInterval) {
        glitchTimer = 0;
        isGlitching = true;
        glitchStartTime = time;

        cubes.forEach((cube) => {
          if (Math.random() > 0.5) {
            cube.mesh.position.x += (Math.random() - 0.5) * 4;
            cube.mesh.position.y += (Math.random() - 0.5) * 4;
            cube.mesh.position.z += (Math.random() - 0.5) * 4;
          }
        });

        mainLight.color.setHex(Math.random() > 0.5 ? 0xff00ff : 0x00ff00);
        accentLight.color.setHex(Math.random() > 0.5 ? 0x00ff00 : 0xff00ff);
      }

      if (isGlitching && time - glitchStartTime > 200) {
        isGlitching = false;
        mainLight.color.setHex(0x00ff00);
        accentLight.color.setHex(0xff00ff);

        cubes.forEach((cube) => {
          cube.mesh.position.copy(cube.originalPos);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
}
