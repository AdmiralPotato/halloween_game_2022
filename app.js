const displayScore = document.getElementById('score');
const buttonStart = document.getElementById('start');
const buttonMap = {};
let game;
let gameBoard;
const makeButtonToggle = (name, state) => {
	return (event) => {
		event.preventDefault();
		const button = buttonMap[name];
		button.state = state;
		const classList = button.element.classList;
		if (classList) {
			classList[state ? 'add' : 'remove']('active');
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
const ambientLight = new THREE.AmbientLight( 0xffffff, 1 );
scene.add( ambientLight );
const directionalLight = new THREE.DirectionalLight( 0x440000, 5 );
scene.add( directionalLight );
scene.add( directionalLight.target );
directionalLight.position.set(0, 1, 0.25);

const near = 4;
const far = 12;
const color = 0x440044;
scene.fog = new THREE.Fog(color, near, far);
scene.background = new THREE.Color(color);

const frameParent = new THREE.Object3D();
const cannonParent = new THREE.Object3D();
const carouselAParent = new THREE.Object3D();
const carouselBParent = new THREE.Object3D();
const material = new THREE.MeshBasicMaterial();
material.wireframe = true;
const wireframeGeometry = new THREE.PlaneGeometry(1, 2);
const wireframeMesh = new THREE.Mesh(wireframeGeometry, material);
scene.add(wireframeMesh);
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
	gear: -0.1,
};
const timeDrag = 0.85;
const timeBuildup = 0.1;
let timeMomentum = 0;
const clock = new THREE.Clock();
let mixer;
function animation () {
	resize();
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
	if (mixer) {
		mixer.update(clock.getDelta());
	}

	renderer.render(scene, camera);
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
loadGlb('assets/carousel_b.glb', carouselBParent);
loadGlb('assets/mage.glb', scene, (gltf) => {
	window.mageGLTF = gltf;
	mixer = new THREE.AnimationMixer(gltf.scene);
	gltf.animations.forEach((clip) => {
		mixer.clipAction(clip).play();
	});
});

const startGame = () => {
	if (gameBoard) {
		scene.remove(gameBoard);
	}
	game = window.makeGameState({
		rowSize: 3 + Math.floor(Math.random() * 9),
	});
	gameBoard = window.makeGameBoard(game);
	console.log('Game started!');
	scene.add(gameBoard);
};
buttonStart.addEventListener('click', startGame);

startGame();
