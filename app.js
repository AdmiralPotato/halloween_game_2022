const displayScore = document.getElementById('score');
const displayDanger = document.getElementById('danger-inside');
const buttonStart = document.getElementById('start');
const buttonMap = {};
const buttonStartHandlerMap = {
	center: () => {
		gameBoard.shoot(cannonParent.rotation.z);
	},
};
let game;
let gameBoard;
const makeButtonToggle = (name, state) => {
	return (event) => {
		event.preventDefault();
		const button = buttonMap[name];
		const firstFire = state && !button.state;
		button.state = state;
		const classList = button.element.classList;
		if (classList) {
			classList[state ? 'add' : 'remove']('active');
		}
		if (
			firstFire
			&& buttonStartHandlerMap[name]
		) {
			buttonStartHandlerMap[name]();
		}
	};
};
const keyButtonMap = {
	a: 'left',
	w: 'center',
	d: 'right',
	ArrowLeft: 'left',
	ArrowUp: 'center',
	ArrowRight: 'right',
	' ': 'center',
};
const onButtonEvents = [
	'mousedown',
	'touchstart',
];
const offButtonEvents = [
	'mouseup',
	'mouseout',
	'touchcancel',
	'touchend',
];
[
	'left',
	'center',
	'right',
].forEach((id) => {
	const button = {
		down: false,
		element: document.getElementById(id),
		handlers: {
			on: makeButtonToggle(id, true),
			off: makeButtonToggle(id, false),
		},
	};
	onButtonEvents.forEach((eventName) => {
		button.element.addEventListener(eventName, button.handlers.on);
	});
	offButtonEvents.forEach((eventName) => {
		button.element.addEventListener(eventName, button.handlers.off);
	});
	buttonMap[id] = button;
});
window.addEventListener('keydown', (keydownEvent) => {
	// console.log('keydownEvent', keydownEvent);
	const buttonName = keyButtonMap[keydownEvent.key];
	if(buttonName){
		buttonMap[buttonName].handlers.on(keydownEvent);
	}
});
window.addEventListener('keyup', (keydownEvent) => {
	// console.log('keydownEvent', keydownEvent);
	const buttonName = keyButtonMap[keydownEvent.key];
	if(buttonName){
		buttonMap[buttonName].handlers.off(keydownEvent);
	}
});

var THREE = window.THREE;

const deg = Math.PI / 180;
let width = 0;
let height = 0;

const loader = new THREE.GLTFLoader();

const bounds = document.querySelector('#game-container');

const camera = new THREE.PerspectiveCamera(
	1,
	window.innerWidth / window.innerHeight,
	0.01,
	1000,
);
camera.position.z = 5;

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
scene.add( ambientLight );

const rimLightBrightness = 0.2;
const rimLightR = new THREE.DirectionalLight( 0xffaa66, rimLightBrightness);
rimLightR.position.set(0.5, 0, -1);
rimLightR.castShadow = true;
scene.add(rimLightR);
const rimLightL = new THREE.DirectionalLight( 0xaaff66, rimLightBrightness);
rimLightL.position.set(-0.5, 0, -1);
rimLightL.castShadow = true;
scene.add(rimLightL);

const fillLight = new THREE.DirectionalLight(0xffcccc, 1);
scene.add( fillLight );
scene.add( fillLight.target );
fillLight.position.set(0, 1, 0.5);

const near = 4;
const far = 12;
const color = 0x440044;
scene.fog = new THREE.Fog(color, near, far);
scene.background = new THREE.Color(color);

const frameParent = new THREE.Object3D();
const smoosherClipPlanes = [
	new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0.85 ),
];
const smoosherParent = new THREE.Object3D();
window.smoosherParent = smoosherParent;
const cannonParent = new THREE.Object3D();
window.cannonParent = cannonParent;
const carouselAParent = new THREE.Object3D();
const carouselBParent = new THREE.Object3D();
window.showBounds = false;
const boundsWireframeMaterial = new THREE.MeshBasicMaterial();
boundsWireframeMaterial.wireframe = true;
const wireframeGeometry = new THREE.PlaneGeometry(1, 2);
const boundsWireframe = new THREE.Mesh(wireframeGeometry, boundsWireframeMaterial);
smoosherParent.position.z = 0;
scene.add(smoosherParent);
scene.add(boundsWireframe);
scene.add(frameParent);
scene.add(cannonParent);
scene.add(carouselAParent);
scene.add(carouselBParent);
cannonParent.position.y = -0.55;
const cannonArrow = new THREE.ArrowHelper(
	new THREE.Vector3( 0, 1, 0 ).normalize(),
	new THREE.Vector3( 0, 0, 0 ),
	1,
	0xffff00,
);
cannonParent.add(cannonArrow);
const carouselConfig = {
	a: {
		phase: 0,
		amp: 0.13962634015954636,
		speed: 0.00033,
	},
	b: {
		phase: 0,
		amp: 0.10471975511965978,
		speed: 0.00054,
	},
};

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
const canvas = renderer.domElement;

const resize = () => {
	const clientWidth = bounds.clientWidth;
	const clientHeight = bounds.clientHeight;
	const dpr = window.devicePixelRatio;
	width = clientWidth * dpr;
	height = clientHeight * dpr;
	if (
		canvas.width !== width ||
		canvas.height !== height
	) {
		const aspect = width / height;
		const desiredMinimumFov = 22.62 * deg;
		camera.fov = desiredMinimumFov / deg;
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
		renderer.setPixelRatio(dpr);
		renderer.setSize(
			clientWidth,
			clientHeight,
			false,
		);
	}
};

const speeds = {
	cannon: 0.01,
	crank: 2,
	gear: -0.01,
};
const timeDrag = 0.80;
const timeBuildup = 0.22;
let timeMomentum = 0;
const clock = new THREE.Clock();
let mixer;
let lastTime = 0;
function animation (time) {
	const deltaTime = (time - lastTime) / 1000;
	resize();
	if (gameBoard) {
		boundsWireframe.visible = window.showBounds;
	}
	if (mixer) {
		if (buttonMap.left.state) {
			timeMomentum += timeBuildup;
		}
		if (buttonMap.right.state) {
			timeMomentum -= timeBuildup;
		}
		timeMomentum *= timeDrag;
		const timeDirection =+ timeMomentum;
		const gear = frameParent.getObjectByName('LinkageGear001');
		mixer.timeScale = timeDirection * speeds.crank;
		cannonParent.rotation.z += timeDirection * speeds.cannon;
		if (gear) {
			gear.rotation.z += timeDirection * speeds.gear;
		}
	}
	cannonParent.scale.y = buttonMap.center.state
		? 1.25
		: 1;
	const a = carouselConfig.a;
	const b = carouselConfig.b;
	a.phase += a.speed;
	b.phase += b.speed;
	carouselAParent.rotation.y = Math.sin(a.phase) * a.amp;
	carouselBParent.rotation.y = Math.cos(b.phase) * b.amp;
	if (
		game?.state.score !== undefined &&
		displayScore.innerText !== game.state.score + ''
	) {
		displayScore.innerText = game.state.score + '';
	}
	const danger = game.getDanger() * 100 + '%';
	if (
		game &&
		displayDanger.style.width !== danger
	) {
		displayDanger.style.width = danger;
	}
	if (mixer) {
		mixer.update(clock.getDelta());
	}

	gameBoard.tick(deltaTime);
	renderer.render(scene, camera);
	lastTime = time;
}

renderer.setAnimationLoop(animation);
bounds.appendChild(renderer.domElement);

function loadGlb (path, parentObject, callback) {
	loader.load(
		path,
		function (gltf) {
			parentObject.add(gltf.scene);
			gltf.scene.traverse((object) => {
				// objects that were totally not of camera were getting culled.
				// reference: https://discourse.threejs.org/t/mesh-disapear-when-camera-close/2914/4
				object.frustumCulled = false;
			});
			if (callback) {
				callback(gltf);
			}
			// gltf.animations; // Array<THREE.AnimationClip>
			// gltf.scene; // THREE.Group
			// gltf.scenes; // Array<THREE.Group>
			// gltf.cameras; // Array<THREE.Camera>
			// gltf.asset; // Object
		},
		/*
		function (xhr) {
			// console.log((xhr.loaded / xhr.total * 100) + '% loaded', xhr);
		},
		function (error) {
			// console.log('An error happened', error);
		}
		*/
	);
}

loadGlb('assets/cannon.glb', cannonParent);
loadGlb('assets/frame.glb', frameParent);
loadGlb('assets/carousel_a.glb', carouselAParent);
loadGlb('assets/carousel_b.glb', carouselBParent);
loadGlb('assets/smoosher.glb', smoosherParent, () => {
	smoosherParent.getObjectByProperty('isMesh', true)
		.material.clippingPlanes = smoosherClipPlanes;
});
loadGlb('assets/mage.glb', scene, (gltf) => {
	window.mageGLTF = gltf;
	mixer = new THREE.AnimationMixer(gltf.scene);
	gltf.animations.forEach((clip) => {
		mixer.clipAction(clip).play();
	});
});

const createRandomScenario = () => {
	const rows = 3 + Math.floor(Math.random() * 6);
	return {
		rowSize: rows,
		levelHeight: Math.floor(rows * 2),
	};
};

const startGame = (startConfig) => {
	if (gameBoard) {
		scene.remove(gameBoard);
	}
	const config = startConfig || createRandomScenario();
	game = window.makeGameState(config);
	gameBoard = window.makeGameBoard(game);
	console.log('Game started!');
	game.on('win', (state) => {
		alert(`YOU WIN!!! SCORE: ${state.score}`);
		startGame();
	});
	game.on('lose', (state) => {
		alert(`YOU LOSE!!! SCORE: ${state.score}`);
		startGame();
	});
	scene.add(gameBoard);
};
buttonStart.addEventListener('click', () => {
	startGame();
});

startGame();
