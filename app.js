const THREE = window.THREE;

const loader = new THREE.GLTFLoader();

const bounds = document.querySelector('.boundsB');

const camera = new THREE.PerspectiveCamera(
	1,
	window.innerWidth / window.innerHeight,
	0.01,
	1000
);
camera.position.z = 3;

const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight( 0xffffff, 1 );
scene.add( ambientLight );
const directionalLight = new THREE.DirectionalLight( 0xff0000, 5 );
scene.add( directionalLight );
scene.add( directionalLight.target );
directionalLight.position.set(0, -1, 0);
const frameParent = new THREE.Object3D();
const cannonParent = new THREE.Object3D();
const carouselParent = new THREE.Object3D();
const material = new THREE.MeshBasicMaterial();
material.wireframe = true;
const wireframeGeometry = new THREE.PlaneGeometry(1, 2);
const wireframeMesh = new THREE.Mesh(wireframeGeometry, material);
scene.add(wireframeMesh);
scene.add(frameParent);
scene.add(cannonParent);
scene.add(carouselParent);
cannonParent.position.y = -0.85;
carouselParent.position.x = 2.3848;
carouselParent.position.z = -7.1374;
carouselParent.position.y = -0.974063;
carouselParent.rotation.z = Math.PI / -7;
carouselParent.rotation.order = 'ZYX';

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const canvas = renderer.domElement;

const deg = Math.PI / 180;
let width = 0;
let height = 0;

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
		const desiredMinimumFov = 36.87 * deg;
		camera.fov = desiredMinimumFov / deg;
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
		renderer.setPixelRatio(dpr);
		renderer.setSize(
			clientWidth,
			clientHeight,
			false
		);
	}
};

function animation (time) {
	resize();

	cannonParent.rotation.z = time / 1000;
	carouselParent.rotation.y = time / 1000;
	directionalLight.rotation.y = time / 1000;

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
loadGlb('assets/carousel.glb', carouselParent);
