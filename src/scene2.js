import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

class MainScene {
	constructor() {
		this.scene = new THREE.Scene();
		this.renderer = this.initRenderer();
		this.camera = this.initCamera();
		this.lights = this.initLights();
		this.floor = this.initFloor();
		this.models = [];
		this.mixer = null;
		this.clock = new THREE.Clock();
		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		this.isPressed = false;

		this.initEnvironment();
		this.initEventListeners();
		this.animate();
	}

	initRenderer() {
		const canvas = document.querySelector('#three-canvas');
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
		renderer.setClearColor('#EDBC9B');
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		return renderer;
	}

	initCamera() {
		const camera = new THREE.OrthographicCamera(
			-(window.innerWidth / window.innerHeight),
			window.innerWidth / window.innerHeight,
			1,
			-1,
			-1000,
			1000
		);
		camera.position.set(1, 5, 5);
		camera.zoom = 0.2;
		camera.updateProjectionMatrix();
		this.scene.add(camera);
		return camera;
	}

	initLights() {
		const ambientLight = new THREE.AmbientLight('orange', 0.7);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight('white', 1.0);
		directionalLight.position.set(1, 1, 1);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		directionalLight.shadow.camera.near = -100;
		directionalLight.shadow.camera.far = 100;
		this.scene.add(directionalLight);
	}

	initFloor() {
		const textureLoader = new THREE.TextureLoader();
		const floorTexture = textureLoader.load('/images/ground.jpg');
		floorTexture.wrapS = THREE.RepeatWrapping;
		floorTexture.wrapT = THREE.RepeatWrapping;
		floorTexture.repeat.x = 10;
		floorTexture.repeat.y = 10;

		const floorMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(100, 100),
			new THREE.MeshStandardMaterial({ map: floorTexture })
		);
		floorMesh.rotation.x = -Math.PI / 2;
		floorMesh.receiveShadow = true;
		this.scene.add(floorMesh);
		return floorMesh;
	}

	initEnvironment() {
		const rgbeLoader = new RGBELoader();
		rgbeLoader.load('/images/belfast_sunset_4k.hdr', texture => {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			this.scene.background = texture;
			this.scene.environment = texture;
			this.scene.backgroundIntensity = 0.1;
			this.scene.environmentIntensity = 0.25;
		});
	}

	initEventListeners() {
		window.addEventListener('resize', this.onWindowResize.bind(this));
		document.addEventListener('mousedown', this.onMouseDown.bind(this));
		document.addEventListener('mouseup', this.onMouseUp.bind(this));
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
		document.addEventListener('click', this.onClick.bind(this));
	}

	animate() {
		const delta = this.clock.getDelta();
		this.update(delta);
		this.renderer.render(this.scene, this.camera);
		this.renderer.setAnimationLoop(this.animate.bind(this));
	}

	update(delta) {
		this.models.forEach(model => {
			if (model.mixer) model.mixer.update(delta);
			if (model.update) model.update(delta);
		});

		if (this.isPressed) {
			this.raycasting();
		}
	}

	onWindowResize() {
		this.camera.left = -(window.innerWidth / window.innerHeight);
		this.camera.right = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	onMouseDown(e) {
		this.isPressed = true;
		this.calculateMousePosition(e);
	}

	onMouseUp() {
		this.isPressed = false;
	}

	onMouseMove(e) {
		if (this.isPressed) {
			this.calculateMousePosition(e);
		}
	}

	onClick(event) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		this.raycaster.setFromCamera(this.mouse, this.camera);
	}

	calculateMousePosition(e) {
		this.mouse.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
		this.mouse.y = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
	}

	raycasting() {
		this.raycaster.setFromCamera(this.mouse, this.camera);
		const intersects = this.raycaster.intersectObjects(this.models.map(m => m.mesh));
		if (intersects.length > 0) {
			const destinationPoint = intersects[0].point;
			this.models.forEach(model => model.onIntersect(destinationPoint));
		}
	}

	addModel(model) {
		this.models.push(model);
		this.scene.add(model.mesh);
	}
}

class Model {
	constructor(scene, gltfPath, material, scale = 1, position = new THREE.Vector3()) {
		this.scene = scene;
		this.loader = new GLTFLoader();
		this.mixer = null;
		this.material = material;
		this.mesh = null;

		this.loader.load(gltfPath, gltf => {
			this.mesh = gltf.scene;
			this.mesh.scale.set(scale, scale, scale);
			this.mesh.position.copy(position);
			this.mesh.traverse(child => {
				if (child.isMesh) {
					child.material = this.material;
				}
			});
			this.scene.add(this.mesh);

			if (gltf.animations.length > 0) {
				this.mixer = new THREE.AnimationMixer(this.mesh);
				const action = this.mixer.clipAction(gltf.animations[0]);
				action.play();
			}
		});
	}

	onIntersect(destination) {
		// Override in subclass if needed
	}

	update(delta) {
		// Override in subclass if needed
	}
}

class Player extends Model {
	constructor(scene, gltfPath, material) {
		super(scene, gltfPath, material, 0.005, new THREE.Vector3(0, 0, 0));
		this.moving = false;
	}

	onIntersect(destination) {
		this.moving = true;
		gsap.to(this.mesh.position, {
			x: destination.x,
			y: destination.y,
			z: destination.z,
			duration: 2,
			ease: 'power2.inOut',
			onComplete: () => {
				this.moving = false;
			}
		});
	}

	update(delta) {
		if (this.moving && this.mesh) {
			this.scene.camera.lookAt(this.mesh.position);
		}
	}
}

class House extends Model {
	constructor(scene, gltfPath, material, position) {
		super(scene, gltfPath, material, 1, position);
	}
}

// Usage
const mainScene = new MainScene();

const elepondMaterial = new THREE.MeshStandardMaterial({ color: 0xE6E6E6, roughness: 0.4, metalness: 0.2, flatShading: true });
const player = new Player(mainScene.scene, '/models/tex_move.glb', elepondMaterial);
const house = new House(mainScene.scene, '/models/lowpoly_ear.glb', elepondMaterial, new THREE.Vector3(5, -4.3, 2));

mainScene.addModel(player);
mainScene.addModel(house);
