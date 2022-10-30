import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.146.0/three.module.js';

const bounds = document.querySelector('.boundsB');

const camera = new THREE.PerspectiveCamera(1, window.innerWidth / window.innerHeight, 0.01, 10);
camera.position.z = 1;

const scene = new THREE.Scene();
const material = new THREE.MeshNormalMaterial();
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const frameGeometry = new THREE.BoxGeometry(1, 2, 0);
const cubeMesh = new THREE.Mesh(geometry, material);
const frameMesh = new THREE.Mesh(frameGeometry, material);
scene.add(cubeMesh);
scene.add(frameMesh);

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});
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
		const desiredMinimumFov = Math.PI / 2; // 90 deg
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

	cubeMesh.rotation.x = time / 2000;
	cubeMesh.rotation.y = time / 1000;

	renderer.render(scene, camera);
}

renderer.setAnimationLoop(animation);
bounds.appendChild(renderer.domElement);
