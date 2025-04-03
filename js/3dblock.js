import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';
import {startMicrophoneAnalysis, getAudioDataFrequency, getPitch} from "/js/core.js";
let dataArray = null;
let scene = null;
let hue = null;
let camera = null;
let loader = null; 
let renderer = null; 
let directionalLight = null; 
let vFOV = null; 
let visibleHeight = null; 
let groundGeometry = null; 
let groundMaterial = null; 
let ground = null; 
let geometry = null; 
let cube = null; 
let amount = null; 
let nowTime = null; 
let initialCameraPosition = null; 
let targetCameraPosition = null; 
let currentmodule = null; 
let povTransitionStartTime = null; 
let povTransitionDuration = null; 
let changingPOV = null; 
let nowTimePOV = null; 
let lastPulse = null; 
let ambientLight = null;  

let textureLoader = null;
let topTexture = null;
let bottomTexture = null;
let topMaterial =  null;
let bottomMaterial =  null;
let backgroundPlaneSize = null;
let backgroundPlaneGeometry = null;
let topPlane = null;
let bottomPlane = null;

let skybox = null; 

let smoothHue = 0;

function ThreeDimensionBlock() {
  if (dataArray != null) {
    animate();
    return;
  }
  dataArray = getAudioDataFrequency();
  hue =  getPitch(); 

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);


  loader = new THREE.TextureLoader();
  loader.load('/IMG/sunset.jpg', function(texture) {
      scene.background = texture;
  });
  
  scene.background = skybox;

  camera.position.z = 20;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
  document.body.appendChild(renderer.domElement);

  directionalLight = new THREE.DirectionalLight(0xffffff, 4);
  directionalLight.position.set(-60, 25, 40);
  directionalLight.castShadow = true; 
  directionalLight.target.position.set(0, 0, 0);
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(directionalLight.target);
  scene.add(directionalLight);
  scene.add(ambientLight);

  directionalLight.shadow.mapSize.width = 512;
  directionalLight.shadow.mapSize.height = 512;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.bias = -0.002;

  vFOV = camera.fov * (Math.PI / 180);
  visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;

  groundGeometry = new THREE.BoxGeometry(10000,10000,1);
  groundMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.7
  });

  
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.position.set(0,0,-1.5);
  ground.castShadow = true; 
  ground.receiveShadow = true;
  scene.add(ground); 

  geometry = new THREE.BoxGeometry(1, 1, 1);

  cube = [];
  amount = 1;

  function createCube() {
      for (let i = 0; i < amount; i++) {
          
          const color = new THREE.Color(); 
          color.setHSL(hue%360, 0.5, 0.5); 

          const material = new THREE.MeshStandardMaterial({ color: color }); 

          const newCube = new THREE.Mesh(geometry, material); 
          //let x = Math.random() * 40 - 15; 
          let x = Math.random() * 40 - 15; 
          newCube.lookAt(camera.position); 
          newCube.position.x = x; 
          newCube.position.y = visibleHeight / 2; 
          newCube.castShadow = true; 
          newCube.receiveShadow = true; 
          scene.add(newCube);
          cube.push(newCube);
      }
  }
  nowTime = Date.now();

  function callCube() {
      if (Date.now() - nowTime > 1000) {
          createCube();
          nowTime = Date.now();
      }
  }

  initialCameraPosition = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
  currentmodule = 1;

  targetCameraPosition = [
      new THREE.Vector3(0, -visibleHeight / 2, 2),
      new THREE.Vector3(0, 0, 20),
  ];

  povTransitionStartTime = null;
  povTransitionDuration = 1000;
  changingPOV = false;

  nowTimePOV = Date.now();

  function startPOVChange() {
      if (Date.now() - nowTimePOV > 5000) {
          changingPOV = true;
          povTransitionStartTime = Date.now();
          initialCameraPosition.copy(camera.position);
          currentmodule = (currentmodule + 1) % 2;
          nowTimePOV = Date.now();
      }
  }

  function updatePOV() {
      if (!changingPOV) return;
      const elapsed = Date.now() - povTransitionStartTime;
      const t = Math.min(elapsed / povTransitionDuration, 1);

      camera.position.lerpVectors(initialCameraPosition, targetCameraPosition[currentmodule], t);
      camera.lookAt(0, 0, 0);
      if (t >= 1) {
          changingPOV = false;
      }
  }

  function update() {
      dataArray = getAudioDataFrequency();
      hue = getPitch(); 
      smoothHue += (hue - smoothHue) * 0.0001; 
  }

  lastPulse = 1;
  function animate() {
      update();
      startPOVChange();
      updatePOV();
      renderer.render(scene, camera);

      let totalEnergy = 0;
      for (let i = 0; i < dataArray.length; i++) {
          totalEnergy += dataArray[i];
      }

      let normalEnergy = totalEnergy / (dataArray.length * 255);
      let pulse = 1 + normalEnergy * 20;
      
      lastPulse += ((pulse - lastPulse) / 10)

      for (let i = 0; i < cube.length; i++) {
          cube[i].position.y -= 0.1;
          cube[i].scale.set(lastPulse, lastPulse, lastPulse);

          if (cube[i].position.y <= -visibleHeight / 2) {
              scene.remove(cube[i]);
              cube[i].geometry.dispose();
              cube[i].material.dispose();
              cube.splice(i, 1);
              i--;
          }
      }

      callCube();
      if(window.activemodule == "block") {
        requestAnimationFrame(animate);
      }
  }

  startMicrophoneAnalysis().then(() => {
      animate();
  });

  window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
  });
  
}

export function loopBlock() {
  if(window.activemodule == "block") 
    ThreeDimensionBlock(); 
}
