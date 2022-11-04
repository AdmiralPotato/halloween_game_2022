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
	const boundsGeometry = new THREE.PlaneGeometry(1, 1);
	const bounds = new THREE.Mesh(boundsGeometry, boundsBaterial);
	bounds.scale.y = height;
	bounds.position.y = (height / 2);
	bounds.position.z = -0.1;
	bounds.scale.multiplyScalar(1.01);
	gameBoard.add(bounds);
	gameBoard.bounds = bounds;
	// puts bottom at cannon rotation pivot
	gameBoard.position.y = window.cannonParent.position.y;
	window.smoosherParent.position.y = (
		window.cannonParent.position.y +
		(height * gameBoardScale)
	);
	const bubbleParent = new THREE.Object3D();
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
		hexagons.forEach((hex, index) => {
			hex.material = game.isLastRow(index)
				? hexMaterialActive
				: hexMaterial;
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
	let poppedBubbles = [];
	const popBubbles = (toPop) => {
		toPop.forEach((bubbleIndex) => {
			const bubble = sparseBubbleMap[bubbleIndex];
			bubble.bubbleIndex = bubbleIndex;
			delete sparseBubbleMap[bubbleIndex];
			bubble.velocity = new THREE.Vector3(
				bubble.position.x * 0.015,
				0.05,
				0.05,
			);
			poppedBubbles.push(bubble);
		});
	};
	const cannonShootOrigin = new THREE.Vector3(0, 0, 0);
	const handleKachonk = () => {
		// I hate everything about this function and I don't even know what's
		// happening, but it works now, and I am moving on. I should have
		// found a way to parent them all to one object or something.
		bubbleParent.position.y = -game.state.lowered * heY * bubbleDiameter;
		cannonShootOrigin.y = -bubbleParent.position.y;
		bounds.position.y = bubbleParent.position.y + (height / 2);
		window.smoosherParent.position.y = (
			window.cannonParent.position.y +
			((height - cannonShootOrigin.y) * gameBoardScale)
		);
	};

	refreshBubbles();
	game.on('resolve', refreshBubbles);
	game.on('match', popBubbles);
	game.on('detach', popBubbles);
	game.on('kachonk', handleKachonk);
	let isFiring = false;
	let nextShotBubble;
	let currentShotBubble;
	const cannonWindowScale = 0.16;
	const previewWindowScale = 0.10;
	const readyShot = () => {
		isFiring = false;
		if (!currentShotBubble) {
			// we only need to _make_ one the first time,
			// otherwise we always repurpose the nextShotBubble
			currentShotBubble = window.makeBubble(
				game.state.queue[0] - 1,
				cannonWindowScale,
			);
		} else {
			currentShotBubble = nextShotBubble;
			currentShotBubble.scale.set(
				cannonWindowScale,
				cannonWindowScale,
				cannonWindowScale,
			);
		}
		nextShotBubble = window.makeBubble(
			game.state.queue[1] - 1,
			previewWindowScale,
		);
		// nextShotBubble.position.set(-0.12, -0.55, -0.139135);
		nextShotBubble.position
			.set(-0.175, 0.0035, 0.25)
			.add(cannonShootOrigin);
		currentShotBubble.position
			.set(0, 0, 0.208)
			.add(cannonShootOrigin);
		bubbleParent.add(nextShotBubble);
		bubbleParent.add(currentShotBubble);
		resetHexagons();
	};
	readyShot();
	const originVec2 = new THREE.Vector2(0, 0);
	const shootSpeed = bubbleDiameter * 8;
	gameBoard.shoot = (shootAngle) => {
		if (isFiring) {
			console.log('HOLD YER HORSES');
		} else {
			isFiring = true;
			console.log('FIRE!!!');
			currentShotBubble.scale.set(
				bubbleDiameter,
				bubbleDiameter,
				bubbleDiameter,
			);
			currentShotBubble.position.z = 0;
			currentShotBubble.velocity = new THREE.Vector2(0, 1)
				.rotateAround(
					originVec2,
					shootAngle,
				)
				.multiplyScalar(shootSpeed);
		}
	};

	const gravity = 0.005;
	const startShrink = 0.3;
	const endShrink = 0.0;
	const zeroScaleVector = new THREE.Vector3(0, 0, 0);
	const bubbleScaleVector = new THREE.Vector3(
		bubbleDiameter,
		bubbleDiameter,
		bubbleDiameter,
	);
	const keepBubbleInSceneTest = (b) => b.position.y > endShrink;
	const tickPoppedBubbles = () => {
		poppedBubbles.forEach((bubble) => {
			bubble.position.add(bubble.velocity);
			bubble.velocity.y -= gravity;
			const mapped = THREE.MathUtils.mapLinear(
				bubble.position.y,
				startShrink,
				endShrink,
				0,
				1,
			);
			const progress = THREE.MathUtils.clamp(mapped, 0, 1);
			bubble.scale.lerpVectors(
				bubbleScaleVector,
				zeroScaleVector,
				progress,
			);
			if (!keepBubbleInSceneTest(bubble)) {
				bubbleParent.remove(bubble);
			}
		});
		poppedBubbles = poppedBubbles.filter(keepBubbleInSceneTest);
	};

	gameBoard.tick = (deltaTime) => {
		tickPoppedBubbles();
		if (isFiring) {
			let playCompleted = false;
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
			let targetBubbleCell;
			if (cellValue) {
				playCompleted = true;
				targetBubbleCell = cells.find((cell) => !game.state.tiles[cell.index]);
			} else if (hitCeiling) {
				playCompleted = true;
				targetBubbleCell = closestCell;
			}
			if (targetBubbleCell) {
				currentShotBubble.position
					.set(0,0,0)
					.add(targetBubbleCell.hex.position);
				sparseBubbleMap[targetBubbleCell.index] = currentShotBubble;
				game.play(targetBubbleCell.index);
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
				bubbleParent.remove(currentShotBubble);
				readyShot();
			}
			if (playCompleted) {
				readyShot();
			}
		}
	};
	window.gameBoard = gameBoard;
	return gameBoard;
};
