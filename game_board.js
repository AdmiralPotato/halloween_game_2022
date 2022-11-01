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
const hexMaterialActive = hexMaterial.clone();
hexMaterialActive.color.set(0xff0000);
hexMaterialActive.wireframe = false;
hexMaterialActive.opacity = 0.2;


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
window.makeBubble = (candyIndex, diameter) => {
	const bubble = new THREE.Mesh(
		bubbleGeometry,
		bubbleMaterial,
	);
	const candy = new THREE.Mesh(
		bubbleGeometry,
		candyMaterials[candyIndex],
	);
	candy.scale.set(candyObjectScale, candyObjectScale, candyObjectScale);
	candy.position.set(0, 0, -0.01);
	bubble.add(candy);
	bubble.candyIndex = candyIndex;
	if (diameter) {
		bubble.scale.multiplyScalar(diameter);
	}
	return bubble;
};

const heX = Math.sin(Math.PI / 3);
const heY = 0.75;
window.makeGameBoard = (game) => {
	const state = game.state;
	const columns = state.rowSize;
	const rows = state.levelHeight;
	const gameBoardScale = 0.68; // blue box scale to white box
	const bubbleDiameter = 1 / (columns * heX);
	const bubbleRadius = bubbleDiameter / 2;
	const height = (((rows - 1) * heY) + 1) * bubbleDiameter;

	const boundsBaterial = new THREE.MeshBasicMaterial();
	boundsBaterial.color.set(0x000000);
	boundsBaterial.transparent = true;
	boundsBaterial.opacity = 0.25;
	const gameBoard = new THREE.Object3D();
	const boundsGeometry = new THREE.PlaneGeometry(1, height);
	const bounds = new THREE.Mesh(boundsGeometry, boundsBaterial);
	bounds.position.y = (height / 2);
	bounds.position.z = -0.5;
	bounds.scale.multiplyScalar(1.075);
	gameBoard.add(bounds);
	gameBoard.bounds = bounds;
	// puts bottom at cannon rotation pivot
	gameBoard.position.y = window.cannonParent.position.y;
	window.smoosherParent.position.y = (
		window.cannonParent.position.y +
		(height * gameBoardScale)
	);
	// const bubbleParent = new THREE.Object3D();
	const bubbleParent = new THREE.AxesHelper(0.5);
	gameBoard.scale.set(gameBoardScale, gameBoardScale, gameBoardScale);
	const firstBubbleOffset = new THREE.Vector3(
		heX * 0.5,
		-0.5,
		0,
	).multiplyScalar(bubbleDiameter);
	const topLeftOffset = new THREE.Vector3(
		-0.5, // puts us at left edge of game board
		height, // puts us at top edge of game board
		0,
	);
	gameBoard.add(bubbleParent);
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
		)
			.multiplyScalar(bubbleDiameter)
			.add(topLeftOffset)
			.add(firstBubbleOffset);
	};

	const hexagons = [];
	const originalHex = new THREE.Mesh(
		hexGeometry,
		hexMaterial,
	);
	originalHex.rotation.z = Math.PI / 2;
	originalHex.scale.multiplyScalar(bubbleDiameter);
	// originalHex.position.add(new THREE.Vector3(0, 0, -0.012));
	state.tiles.forEach((value, index) => {
		const hex = originalHex.clone();
		const position = getCoordinatesForIndex(index);
		hex.position.add(position);
		hexagons[index] = hex;
		bubbleParent.add(hex);
	});

	const resetHexagons = () => {
		hexagons.forEach((hex) => {
			hex.material = hexMaterial;
		});
	};
	const getNearestCells = (position) => {
		const cells = [];
		hexagons.forEach((hex, index) => {
			const distance = hex.position.distanceTo(position);
			cells.push({
				index,
				hex,
				distance,
			});
		});
		cells.sort((a, b) => a.distance - b.distance);
		return cells;
	};

	const sparseBubbleMap = {};
	const refreshBubbles = () => {
		state.tiles.forEach((value, index) => {
			if (value && !sparseBubbleMap[index]) {
				const candyIndex = value - 1;
				const position  = getCoordinatesForIndex(index);
				const bubble = window.makeBubble(
					candyIndex,
					bubbleDiameter,
				);
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
	let currentShotBubble;
	const originVec2 = new THREE.Vector2(0, 0);
	const shootSpeed = bubbleDiameter * 8;
	gameBoard.shoot = (shootAngle) => {
		if (currentShotBubble) {
			console.log('HOLD YER HORSES');
		} else {
			console.log('FIRE!!!');
			currentShotBubble = window.makeBubble(
				game.state.queue[0] - 1,
				bubbleDiameter,
			);
			currentShotBubble.velocity = new THREE.Vector2(0, 1)
				.rotateAround(
					originVec2,
					shootAngle,
				)
				.multiplyScalar(shootSpeed);
			bubbleParent.add(currentShotBubble);
		}
	};
	gameBoard.tick = (deltaTime) => {
		if (currentShotBubble) {
			let killBullet = false;
			const movement = currentShotBubble.velocity
				.clone()
				.multiplyScalar(deltaTime);
			currentShotBubble.position.add(movement);
			// because add vec2 to vec3 is nan
			currentShotBubble.position.z = 0;
			resetHexagons();
			const cells = getNearestCells(
				currentShotBubble.position,
			);
			const closestCell = cells.shift();
			closestCell.hex.material = hexMaterialActive;
			const cellValue = game.state.tiles[closestCell.index];
			const hitCeiling = currentShotBubble.position.y > height - bubbleRadius;
			if (cellValue) {
				killBullet = true;
				const nearestEmptyCell = cells.find((cell) => !game.state.tiles[cell.index]);
				game.play(nearestEmptyCell.index);
			} else if (hitCeiling) {
				killBullet = true;
				game.play(closestCell.index);
			}
			if (
				Math.abs(currentShotBubble.position.x) >
				(0.5 - (bubbleRadius))
			) {
				currentShotBubble.velocity.x *= -1;
			}
			// console.log('currentShotBubble.position', currentShotBubble.position);
			if (
				currentShotBubble.position.y < 0
				|| Math.abs(currentShotBubble.position.x) > (0.6 - (bubbleRadius))
			) {
				killBullet = true;
			}
			if (killBullet) {
				bubbleParent.remove(currentShotBubble);
				currentShotBubble = undefined;
			}
		}
	};
	window.gameBoard = gameBoard;
	return gameBoard;
};
