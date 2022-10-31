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
	candy.scale.set(candyObjectScale, candyObjectScale, candyObjectScale);
	candy.position.set(0, 0, -0.1);
	bubble.add(candy);
	bubble.candyIndex = candyIndex;
	return bubble;
};

const whatTheHellIsThisMagicNumber = 1.78;
const heX = Math.sin(Math.PI / 3);
const heY = 0.75;
window.makeGameBoard = (game) => {
	const state = game.state;
	const columns = state.rowSize;
	const rows = state.levelHeight;
	const ratio = rows / columns;
	const gameBoardScale = 0.65;
	const bubbleParentScale = 1 / (columns * heX);

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
	// const bubbleParent = new THREE.Object3D();
	const bubbleParent = new THREE.AxesHelper();
	gameBoard.scale.set(gameBoardScale, gameBoardScale, gameBoardScale);
	bubbleParent.scale.set(
		bubbleParentScale,
		bubbleParentScale,
		bubbleParentScale,
	);
	bubbleParent.position.set(
		-0.5 + (bubbleParentScale * heX * 0.5),
		bubbleParentScale * ((rows - whatTheHellIsThisMagicNumber) / 2),
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
	state.tiles.forEach((value, index) => {
		if (value) {
			const candyIndex = value - 1;
			const position  = getCoordinatesForIndex(index);
			const bubble = window.makeBubble(candyIndex);
			bubble.position.add(position);
			bubbleParent.add(bubble);
		}
	});
	// for (let i = 0; i < candies; i++) {
	// 	const bubble = window.makeBubble(i);
	// 	bubble.position.set(i, 0, 0);
	// 	bubbleParent.add(bubble);
	// }
	return gameBoard;
};
