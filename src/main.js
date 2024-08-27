import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { House } from './House';
import gsap from 'gsap';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';


// ----- 주제: 스크롤에 따라 움직이는 3D 페이지

// Texture
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('/images/ground.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.x = 10;
floorTexture.repeat.y = 10;

// Renderer
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({
	canvas,
	antialias: true,
	alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xC1B1AA);
scene.fog = new THREE.Fog(0xC1B1AA, 5, 10);
// scene.background = new THREE.Color('0*AD8D7F');//배경 덧칠

// Camera
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	8
);
camera.position.set(-5, 2, 25);
scene.add(camera);

// Lighting
const ambientLight = new THREE.AmbientLight('orange', 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('white', 1.0);
const directionalLightOriginPosition = new THREE.Vector3(1, 1, 1);
directionalLight.position.x = directionalLightOriginPosition.x;
directionalLight.position.y = directionalLightOriginPosition.y;
directionalLight.position.z = directionalLightOriginPosition.z;
directionalLight.castShadow = true;

// mapSize 세팅으로 그림자 퀄리티 설정
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
// 그림자 범위
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = -100;
directionalLight.shadow.camera.far = 100;
scene.add(directionalLight);



// HDRI
// renderer.outputEncoding = THREE.sRGBEncoding;

const rgbeLoader = new RGBELoader();
rgbeLoader.load('/images/belfast_sunset_4k.hdr', function (texture) {
	texture.mapping = THREE.EquirectangularReflectionMapping;
	// scene.background = texture;
	scene.environment = texture;
	scene.backgroundIntensity = 0.51; // 배경 밝기 조절
	scene.environmentIntensity = 0.85; // 조명으로 사용되는 환경 맵의 강도 조절

	// // 스카이박스 생성
	// const skyBoxGeometry = new THREE.SphereGeometry(1000, 60, 40);
	// const skyBoxMaterial = new THREE.MeshBasicMaterial({
	// 	map: texture,
	// 	side: THREE.BackSide
	// });
	// const skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
	// scene.add(skyBox);
	// skyBox.position.y = -2;
	// 스카이박스 회전
	// skyBox.rotation.y = Math.PI / 4; // y축 기준으로 45도 회전
	//  // 여기서 draw() 호출
	//  draw();
})
// EffectComposer 설정
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// BokehPass를 이용한 블러 효과 적용
const bokehPass = new BokehPass(scene, camera, {
	focus: 3.5,        // 초점 거리
	aperture: 0.0035,   // 조리개 크기
	maxblur: 0.4,      // 최대 블러 강도
	width: window.innerWidth,
	height: window.innerHeight
});
composer.addPass(bokehPass);




// Mesh
const floorMesh = new THREE.Mesh(
	new THREE.PlaneGeometry(100, 100),
	new THREE.MeshStandardMaterial({
		// color: 'white'
		map: floorTexture,
		// transparent: true,
		// opacity: 0
	})
);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);


const gltfLoader = new GLTFLoader();
const houses = [];
houses.push(new House({ gltfLoader, scene, modelSrc: '/models/ilbuni.glb', x: -5, z: 20, height: 2 }));
houses.push(new House({ gltfLoader, scene, modelSrc: '/models/ilbuni.glb', x: 7, z: 10, height: 2 }));
houses.push(new House({ gltfLoader, scene, modelSrc: '/models/ilbuni.glb', x: -10, z: 0, height: 2 }));
houses.push(new House({ gltfLoader, scene, modelSrc: '/models/ilbuni.glb', x: 10, z: -10, height: 2 }));
houses.push(new House({ gltfLoader, scene, modelSrc: '/models/ilbuni.glb', x: -5, z: -20, height: 2 }));

let modelMesh;

const loader00 = new GLTFLoader();
loader00.load(
	'./models/tex_move.glb',
	gltf => {
		console.log("move", gltf.animations);
		modelMesh = gltf.scene;
		modelMesh.castShadow = true;
		modelMesh.receiveShadow = true;

		modelMesh.scale.set(0.0065, 0.0065, 0.0065);
		modelMesh.position.set(-7, 0, 20);
		modelMesh.rotation.y = Math.PI / 5;

		// scene.add(modelMesh);



	}
)


let moveMesh;
let moveAction;
let mixer_move;

const loader0 = new GLTFLoader();
loader0.load(
	'./models/tex_move.glb',
	gltf => {
		console.log("move", gltf.animations);
		moveMesh = gltf.scene;
		moveMesh.castShadow = true;
		moveMesh.receiveShadow = true;

		moveMesh.scale.set(0.0065, 0.0065, 0.0065);
		moveMesh.position.set(-5, 0, 20);
		// moveMesh.scale.set(0.0065, 0.0065, 0.0065);
		// moveMesh.position.set(10.4, 0, 10);
		// moveMesh.rotation.y = -Math.PI / 3.4;
		
		scene.add(moveMesh);

		// 특정 메쉬에 대해 AnimationMixer 생성
		mixer_move = new THREE.AnimationMixer(moveMesh);

		// 애니메이션 클립을 액션으로 변환
		if (gltf.animations && gltf.animations.length > 0) {
			const moveClip = gltf.animations[0];
			moveAction = mixer.clipAction(moveClip);
			moveAction.play();
		} else {
			console.warn('No animations found in the GLB file.');
		}

	}
)

// let grMesh;

// const loader = new GLTFLoader();
// loader.load(
// 	'./models/ground.glb',
// 	gltf => {
// 		grMesh = gltf.scene;

// 		map: floorTexture;
// 		grMesh.scale.set(0.03, 0.008, 0.03);
// 		grMesh.position.set(0, 0, 0);
// 		grMesh.rotation.y = -Math.PI / 3.4; 
// 		// scene.add(grMesh);

// 	}
// )

let chargeMesh;
let chargeAction;
let mixer;


const loader1 = new GLTFLoader();
loader1.load(
	'./models/tex_charge.glb',
	gltf => {
		console.log("charge", gltf.animations);
		chargeMesh = gltf.scene;
		// chargeMesh.scale.set(0.005, 0.005, 0.005);
		// chargeMesh.scale.set(0, 0, 0);
		chargeMesh.scale.set(0.0065, 0.0065, 0.0065);
		chargeMesh.position.set(10.4, 0.3, 10);
		chargeMesh.rotation.y = -Math.PI / 3.4;
		scene.add(chargeMesh);

		// 특정 메쉬에 대해 AnimationMixer 생성
		mixer = new THREE.AnimationMixer(chargeMesh);

		// 애니메이션 클립을 액션으로 변환
		if (gltf.animations && gltf.animations.length > 0) {
			const chargeClip = gltf.animations[0];
			chargeAction = mixer.clipAction(chargeClip);
			chargeAction.play();
		} else {
			console.warn('No animations found in the GLB file.');
		}
		//  // 로드한 모델을 houses 배열에 추가
		//  houses.push({ mesh: chargeMesh, action: chargeAction, mixer: mixer });
		// },
		// undefined,
		// (error) => {
		// 	console.error('An error happened while loading the model:', error);
	}
)
let hoseMesh;
let hoseAction;
let mixer_hose;

const loader2 = new GLTFLoader();
loader2.load(
	'./models/hose1.glb',
	gltf => {
		console.log("hose", gltf.animations);
		hoseMesh = gltf.scene;
		hoseMesh.castShadow = true;
		hoseMesh.receiveShadow = true;

		hoseMesh.scale.set(0.0065, 0.0065, 0.0065);
		hoseMesh.position.set(-12.95, 0.25, 0);
		hoseMesh.rotation.y = Math.PI / 4;

		scene.add(hoseMesh);

		// 특정 메쉬에 대해 AnimationMixer 생성
		mixer_hose = new THREE.AnimationMixer(hoseMesh);

		// 애니메이션 클립을 액션으로 변환
		if (gltf.animations && gltf.animations.length > 0) {
			const hoseClip = gltf.animations[0];
			hoseAction = mixer_hose.clipAction(hoseClip);
			hoseAction.play();

		} else {
			console.warn('No animations found in the GLB file.');
		}
	}
)
let legMesh;
const loader5 = new GLTFLoader();
loader5.load(
	'./models/hose2.glb',
	gltf => {

		legMesh = gltf.scene;
		legMesh.castShadow = true;
		legMesh.receiveShadow = true;

		legMesh.scale.set(0.0065, 0.0065, 0.0065);
		legMesh.position.set(-13, 0, 0);
		legMesh.rotation.y = Math.PI / 4;

		scene.add(legMesh);
	}
)
let earMesh;
let earAction;
let mixer_ear;

const loader6 = new GLTFLoader();
loader6.load(
	'./models/tex_ear.glb',
	gltf => {
		console.log("ear", gltf.animations);
		earMesh = gltf.scene;
		earMesh.castShadow = true;
		earMesh.receiveShadow = true;

		earMesh.scale.set(0.0065, 0.0065, 0.0065);
		earMesh.position.set(13.5, 0.3, -10);
		earMesh.rotation.y = -Math.PI / 3;

		scene.add(earMesh);
		mixer_ear = new THREE.AnimationMixer(earMesh);

		// 애니메이션 클립을 액션으로 변환
		if (gltf.animations && gltf.animations.length > 0) {
			const earClip = gltf.animations[0];
			earAction = mixer_ear.clipAction(earClip);
			earAction.play();

		} else {
			console.warn('No animations found in the GLB file.');
		}
	}
)

const rainMaterial = new THREE.MeshStandardMaterial({
	color: 0xD9D9D9,
	roughness: 0.4,
	transparent: true, // 투명도 조절을 가능하게 설정
	opacity: 0.7,      // 투명도 50%로 설정
	// flatShading: true
})

let rainMesh;
let rainAction;
let mixer_rain;

const loader7 = new GLTFLoader();
loader7.load(
	'./models/rain_2.glb',
	gltf => {
		console.log("rain", gltf.animations);
		rainMesh = gltf.scene;
		// rainMesh.scale.set(1.3,1.3,1.3);
		rainMesh.castShadow = true;
		rainMesh.receiveShadow = true;

		rainMesh.scale.set(0.008, 0.008, 0.008);
		rainMesh.position.set(13.5, 1.7, -10);
		scene.add(rainMesh);

		rainMesh.traverse(child => {
			if (child.isMesh) {
				child.material = rainMaterial;
			}
		});

		//특정 메쉬에 대해 AnimationMixer 생성
		mixer_rain = new THREE.AnimationMixer(rainMesh);

		// 애니메이션 클립을 액션으로 변환
		if (gltf.animations && gltf.animations.length > 0) {
			const rainClip = gltf.animations[0];
			rainAction = mixer_rain.clipAction(rainClip);
			rainAction.play();

		} else {
			console.warn('No animations found in the GLB file.');
		}
	}
)

let currentSection = 0;
function setSection() {
	// window.pageYOffset
	const newSection = Math.round(window.scrollY / window.innerHeight);
	console.log(newSection);//0~4
	if (currentSection !== newSection) {
		console.log('animation!!');
		gsap.to(
			camera.position,
			{
				duration: 1,
				x: houses[newSection].x,
				z: houses[newSection].z + 5,
			}
		);
		// chargeAction.play();
		currentSection = newSection;
	}
}

// 그리기
const clock = new THREE.Clock();

function draw() {
	const deltaTime = clock.getDelta();
	//  // 렌더러가 아닌 composer를 사용해 렌더링
	composer.render();
	// 배경 렌더링
	// backgroundComposer.render();
	// renderer.render(scene, camera);
	// renderer.setAnimationLoop(draw);
	// mixer가 정의되어 있으면 애니메이션을 업데이트합니다.
	if (mixer) mixer.update(deltaTime);
	if (mixer_move) mixer.update(deltaTime);
	if (mixer_hose) mixer_hose.update(deltaTime);
	if (mixer_ear) mixer_ear.update(deltaTime);
	if (mixer_rain) mixer_rain.update(deltaTime);
	// if ( currentSection == 0){
	// 	moveAction.play();
	// }

	// draw 함수가 애니메이션 루프에서 지속적으로 호출되도록 설정합니다.
	renderer.setAnimationLoop(draw);
}




function setSize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);
}

// function animate() {
// 	const deltaTime = clock.getDelta();
// 	renderer.render(scene, camera);
// 	if (mixer) mixer.update(deltaTime);
// }

// 이벤트
window.addEventListener('scroll', setSection);
window.addEventListener('resize', setSize);
// animate();
draw();
