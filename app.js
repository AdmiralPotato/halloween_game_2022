const displayScore = document.getElementById('score');
const buttonStart = document.getElementById('start');
const buttonLeft = document.getElementById('left');
const buttonCenter = document.getElementById('center');
const buttonRight = document.getElementById('right');
const buttonStates = {
	left: false,
	center: false,
	right: false,
};
let game;
let gameBoard;
const makeButtonToggle = (name, state) => {
	return (event) => {
		buttonStates[name] = state;
		const classList = event?.currentTarget?.classList;
		if (classList) {
			event.preventDefault();
			classList[state ? 'add' : 'remove']('active');
		}
	};
};
const buttonTogglerMap = {
	left: {
		on: makeButtonToggle('left', true),
		off: makeButtonToggle('left', false),
	},
	center: {
		on: makeButtonToggle('center', true),
		off: makeButtonToggle('center', false),
	},
	right: {
		on: makeButtonToggle('right', true),
		off: makeButtonToggle('right', false),
	},
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
onButtonEvents.forEach((eventName) => {
	buttonLeft.addEventListener(eventName, buttonTogglerMap.left.on);
	buttonCenter.addEventListener(eventName, buttonTogglerMap.center.on);
	buttonRight.addEventListener(eventName, buttonTogglerMap.right.on);
});
offButtonEvents.forEach((eventName) => {
	buttonLeft.addEventListener(eventName, buttonTogglerMap.left.off);
	buttonCenter.addEventListener(eventName, buttonTogglerMap.center.off);
	buttonRight.addEventListener(eventName, buttonTogglerMap.right.off);
});
window.addEventListener('keydown', (keydownEvent) => {
	// console.log('keydownEvent', keydownEvent);
	const buttonName = keyButtonMap[keydownEvent.key];
	if(buttonName){
		buttonStates[buttonName] = true;
	}
});
window.addEventListener('keyup', (keydownEvent) => {
	// console.log('keydownEvent', keydownEvent);
	const buttonName = keyButtonMap[keydownEvent.key];
	if(buttonName){
		buttonStates[buttonName] = false;
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
const directionalLight = new THREE.DirectionalLight( 0xff0000, 5 );
scene.add( directionalLight );
scene.add( directionalLight.target );
directionalLight.position.set(0, -1, 0);
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

const cannonRotateSpeed = 0.01;
function animation (time) {
	resize();

	if (buttonStates.left) {
		cannonParent.rotation.z += cannonRotateSpeed;
	}
	if (buttonStates.right) {
		cannonParent.rotation.z -= cannonRotateSpeed;
	}
	cannonParent.scale.y = buttonStates.center
		? 1.25
		: 1;
	const a = carouselConfig.a;
	const b = carouselConfig.b;
	a.phase += a.speed;
	b.phase += b.speed;
	carouselAParent.rotation.y = Math.sin(a.phase) * a.amp;
	carouselBParent.rotation.y = Math.cos(b.phase) * b.amp;
	directionalLight.rotation.y = time / 1000;
	if (game?.state.score !== undefined) {
		displayScore.innerText = game.state.score;
	}

	renderer.render(scene, camera);
}

renderer.setAnimationLoop(animation);
bounds.appendChild(renderer.domElement);

function loadGlb (path, parentObject) {
	loader.load(
		path,
		function (gltf) {
			parentObject.add(gltf.scene);
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
