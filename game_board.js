var THREE = window.THREE;
const textureLoader = new THREE.TextureLoader();

const bubbleTexture = textureLoader.load( 'assets/bubble.png' );
const bubbleMaterial = new THREE.MeshBasicMaterial({
	map: bubbleTexture,
});
bubbleMaterial.transparent = true;
const bubbleGeomScale = 0.9;
const bubbleGeometry = new THREE.PlaneGeometry(
	bubbleGeomScale,
	bubbleGeomScale,
);
const hexGeometry = new THREE.CircleGeometry(
	0.5,
	6,
);
const hexMaterial = new THREE.MeshBasicMaterial();
hexMaterial.color.set(0xffffff);
hexMaterial.wireframe = true;
hexMaterial.transparent = true;
hexMaterial.opacity = 0.0625;

const candies = 9;
const candiesPerRow = 3;
const candyMaterials = [];
const candyScale = 1 / candiesPerRow;
const candyTexture = textureLoader.load(
	'assets/candy.png',
	() => {
		// create and swap out the UV offset textures now that
		// the original one has finished loading.
		for (let i = 0; i < candies; i++) {
			const clonedTexture = candyTexture.clone();
			clonedTexture.offset.set(
				candyScale * (i % candiesPerRow),
				(2/3) - (candyScale * Math.floor(i / candiesPerRow)),
				// ^ not sure why 2/3rds make it index like expected but whatevs
			);
			candyMaterials[i].map = clonedTexture;
		}
	},
);
candyTexture.repeat.set(
	candyScale,
	candyScale,
);
for (let i = 0; i < candies; i++) {
	const candyMaterial = new THREE.MeshBasicMaterial({
		map: candyTexture,
	});
	candyMaterial.transparent = true;
	candyMaterials.push(candyMaterial);
}

const candyObjectScale = 0.9;
window.makeBubble = (candyIndex) => {
	const bubble = new THREE.Mesh(
		bubbleGeometry,
		bubbleMaterial,
	);
	const candy = new THREE.Mesh(
		bubbleGeometry,
		candyMaterials[candyIndex],
	);
	const hex = new THREE.Mesh(
		hexGeometry,
		hexMaterial,
	);
	hex.rotation.z = Math.PI / 2;
	candy.scale.set(candyObjectScale, candyObjectScale, candyObjectScale);
	candy.position.set(0, 0, -0.1);
	bubble.add(candy);
	bubble.add(hex);
	bubble.candyIndex = candyIndex;
	return bubble;
};

const heX = Math.sin(Math.PI / 3);
const heY = 0.75;
window.makeGameBoard = (game) => {
	const state = game.state;
	const columns = state.rowSize;
	const rows = state.levelHeight;
	const gameBoardScale = 0.65; // blue box scale to white box
	const bubbleDiameter = 1 / (columns * heX);
	const height = (((rows - 1) * heY) + 1) * bubbleDiameter;
	const ratio = height / 1; // because width is always 1!
	const halfBubbleWidthInBoardSpace = bubbleDiameter * heX * 0.5;

	const material = new THREE.MeshBasicMaterial();
	material.color.set(0x0000ff);
	material.wireframe = true;
	const wireframeGeometry = new THREE.PlaneGeometry(1, ratio);
	const gameBoard = new THREE.Object3D();
	const gameBoardBounds = new THREE.Mesh(wireframeGeometry, material);
	gameBoard.add(gameBoardBounds);
	// puts the origin at the bottom of the bounding box.
	gameBoardBounds.position.y = (ratio / 2);
	// puts bottom at cannon rotation pivot
	gameBoard.position.y = window.cannonParent.position.y;
	window.smoosherParent.position.y = (
		window.cannonParent.position.y +
		(ratio * gameBoardScale)
	);
	// const bubbleParent = new THREE.Object3D();
	const bubbleParent = new THREE.AxesHelper();
	gameBoard.scale.set(gameBoardScale, gameBoardScale, gameBoardScale);
	bubbleParent.scale.set(
		bubbleDiameter,
		bubbleDiameter,
		bubbleDiameter,
	);
	bubbleParent.position.set(
		(
			-0.5 // puts us at left edge of game board
			+ halfBubbleWidthInBoardSpace
		),
		(
			(ratio / 2) // puts us at top edge of game board
			- (0.5 * bubbleDiameter)
		),
		0,
	);
	gameBoard.add(bubbleParent);
	gameBoardBounds.add(bubbleParent);
	const getCoordinatesForIndex = (index) => {
		const [
			row,
			col,
		] = window.getRowCol(index, columns);
		const offset = window.isFatRow(index, columns)
			? 0
			: 0.5;
		return new THREE.Vector3(
			(col + offset) * heX,
			-row * heY,
			0,
		);
	};
	const sparseBubbleMap = {};
	const refreshBubbles = () => {
		state.tiles.forEach((value, index) => {
			if (value && !sparseBubbleMap[index]) {
				const candyIndex = value - 1;
				const position  = getCoordinatesForIndex(index);
				const bubble = window.makeBubble(candyIndex);
				sparseBubbleMap[index] = bubble;
				bubble.position.add(position);
				bubbleParent.add(bubble);
			} else if (!value && sparseBubbleMap[index]) {
				bubbleParent.remove(sparseBubbleMap[index]);
				delete sparseBubbleMap[index];
			}
		});
	};
	refreshBubbles();
	game.on('resolve', refreshBubbles);
	gameBoard.shoot = () => {

	};
	return gameBoard;
};
