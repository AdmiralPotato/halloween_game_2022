const cleanFromTiled = (array, toplineSize) => {
	// makes the tiles array hourglass-shaped
	// instead of staggered
	return array.filter((value, index) => (index + 1) % (toplineSize * 2));
};

const isFatRow = (index, rowSize) => {
	const doubleDeckerSize = rowSize * 2 - 1;
	const mod = index % doubleDeckerSize;
	return mod < rowSize;
};
window.isFatRow = isFatRow;

const getRowCol = (index, rowSize) => {
	const doubleDeckerSize = rowSize * 2 - 1;
	const doubleDeckerCount = Math.floor(index / doubleDeckerSize);
	const remainder = index % doubleDeckerSize;
	let row = doubleDeckerCount * 2;
	let col = remainder;
	if (!isFatRow(index, rowSize)) {
		row += 1;
		col -= rowSize;
	}
	return [row, col];
};
window.getRowCol = getRowCol;

const getIndex = (rowCol, rowSize) => {
	// rowCol is an array like [row, col]
	if (rowCol[1] < 0) {
		return false;
	}
	if (rowCol[0] < 0) {
		return false;
	}
	const fat = !(rowCol[0] % 2);
	const realRowSize = fat ? rowSize : rowSize - 1;
	if (rowCol[1] >= realRowSize) {
		return false;
	}
	const row = rowCol[0];
	const col = rowCol[1];
	const doubleDeckerSize = rowSize * 2 - 1;
	let index = doubleDeckerSize * Math.floor(row / 2);
	index = row % 2 ? index + rowSize : index;
	index += col;
	return index;
};

const getNeighborIndices = (index, rowSize) => {
	const rowCol = getRowCol(index, rowSize);
	const row = rowCol[0];
	const col = rowCol[1];
	const offset = isFatRow(index, rowSize) ? -1 : 0;
	const neighbors = [
		getIndex([row, col - 1], rowSize), // west
		getIndex([row, col + 1], rowSize), // east
		getIndex([row - 1, col + offset], rowSize), // northwest
		getIndex([row - 1, col + 1 + offset], rowSize), // northeast
		getIndex([row + 1, col + offset], rowSize), // southwest
		getIndex([row + 1, col + 1 + offset], rowSize), // southeast
	];
	return neighbors
		.filter((item) => item !== false)
		.sort((a, b) => a - b);
};

const findContiguousMatches = (index, state) => {
	const rowSize = state.rowSize;
	const tiles = state.tiles;
	const matchValue = tiles[index]; // 5
	let result = [];
	let crawled = { [index]: true };
	let queue = [];
	let toCrawl = [ index ];
	while (toCrawl.length) {
		toCrawl.forEach(function (index) { // 13
			result.push(index);
			const uncrawledNeighbors = getNeighborIndices(index, rowSize)
				.filter((index) => !crawled[index]);
			// => [7,8,12,14,18,19]
			uncrawledNeighbors.forEach(function (index) {
				crawled[index] = true;
			});
			const matchedNeighbors = uncrawledNeighbors
				.filter((index) => tiles[index] === matchValue);
				// => [7,14]
			queue = queue.concat(matchedNeighbors);
		});
		toCrawl = queue;
		queue = [];
	}
	return result.sort((a, b) => a - b);
};

const findAttached = (state) => {
	const rowSize = state.rowSize;
	const tiles = state.tiles;
	let result = [];
	let crawled = {};
	for (let i = 0; i < rowSize; i++) {
		if (tiles[i] > 0) {
			result.push(i);
			crawled[i] = true;
		}
	}
	tiles.forEach(function (value, index) {
		if (value === 0) {
			crawled[index] = 'empty';
		}
	});
	let queue = [];
	let toCrawl = result.slice();
	while (toCrawl.length) {
		toCrawl.forEach(function (index) {
			let neighbors = getNeighborIndices(index, rowSize)
				.filter((item) => !crawled[item]);
			neighbors.forEach(function (index) {
				if (tiles[index]) {
					result.push(index);
					queue.push(index);
					crawled[index] = true;
				}
			});
		});
		toCrawl = queue;
		queue = [];
	}
	return result.sort((a, b) => a - b);
};

const findUnattached = (state) => {
	const attached = findAttached(state);
	const tiles = state.tiles;
	let result = [];
	tiles.forEach(function (value, index) {
		if (
			value > 0
			&& !attached.includes(index)
		) {
			result.push(index);
		}
	});
	return result;
};

const advanceDangerLevel = (state) => {
	state.dangerState += 1;
	if (state.dangerState > state.dangerRamp) {
		state.lowered += 1;
		state.dangerState = 0;
		// shave bottom row
		state.tiles = state.tiles
			.filter((value, index) => !isLastRow(index, state));
	}
	return state;
};

const isLastRow = (index, state) => {
	const lastBubbleRow = getRowCol(state.tiles.length - 1, state.rowSize)[0];
	const testBubbleRow = getRowCol(index, state.rowSize)[0];
	return lastBubbleRow === testBubbleRow;
};

const isGameLost = (state) => {
	for (let i = 0; i < state.tiles.length; i++) {
		if (
			state.tiles[i] !== 0
			&& isLastRow(i, state)
		) {
			return true;
		}
	}
	return false;
};
const isGameWon = (state) => {
	for (let i = 0; i < state.tiles.length; i++) {
		if (state.tiles[i] !== 0) {
			return false;
		}
	}
	return true;
};

const printGameMeta = (state) => {
	let openIndices = [];
	state.tiles.forEach(function (value, index) {
		if (value === 0) {
			let insert = index;
			if (isLastRow(index, state)) {
				insert = '(' + index + ')';
			}
			openIndices.push(insert);
		}
	});
	let dangerLevel = state.dangerState / state.dangerRamp || 0;
	let dangerPercent = Math.floor(dangerLevel * 100);
	let printie = `Score: ${state.score} -- Danger: ${dangerPercent}%`;
	printie += '\nOpen indices: ' + openIndices.join(', ');
	console.log(printie);
	return printie;
};

const printGameBoard = (state) => {
	const tiles = state.tiles;
	let printSize = 0;
	tiles.forEach(function (item) {
		var printie = item + '';
		printSize = Math.max(printSize, printie.length);
	});
	const ceilingWidth = (printSize + 1) * state.rowSize - 1;
	const ceilingString = 'X'.repeat(ceilingWidth);
	const printTiles = tiles.map(function (item, index) {
		let printItem = item + '';
		if (item === 0) {
			printItem = isLastRow(index, state) ? 'x' : '.';
		}
		const lengthDiff = printSize - printItem.length;
		for (let i = 0; i < lengthDiff; i++) {
			printItem += ' ';
		}
		return printItem;
	});
	const offset = Math.floor((printSize + 1) / 2);
	let offsetString = '';
	for (let i = 0; i < offset; i++) {
		offsetString += ' ';
	}
	let result = '';
	for (let i = 0; i < state.lowered; i++) {
		result += ceilingString + '\n';
	}
	let currRow = 0;
	printTiles.forEach(function (item, index) {
		const rowCol = getRowCol(index, state.rowSize);
		if (currRow !== rowCol[0]) {
			result += '\n';
			if (!isFatRow(index, state.rowSize)) {
				result += offsetString;
			}
			currRow = rowCol[0];
		}
		result += item + ' ';
	});
	result += `\n    ^ ${state.queue[0]} < ${state.queue[1]}`;
	console.log(result);
	return result;
};

const getInPlayBubbles = (state) => {
	let possibles = {};
	state.tiles.forEach(function (item) {
		if (item !== 0) {
			possibles[item] = true;
		}
	});
	return Object.keys(possibles).sort((a, b) => a - b);
};
const getRandomBubbleFromState = (state) => {
	const possibles = getInPlayBubbles(state);
	const random = Math.floor(Math.random() * possibles.length);
	return possibles[random] * 1;
};

const placeBubble = (placingIndex, bubbleValue, state) => {
	if (state.tiles[placingIndex] !== 0) {
		console.warn(`Cannot place a bubble at index ${placingIndex}! There is a bubble there already!`);
		return false;
	} else {
		state.tiles[placingIndex] = bubbleValue;
		const matches = findContiguousMatches(placingIndex, state);
		if (matches.length >= 3) {
			state.popped = state.popped ? state.popped : [];
			state.popped.push(matches);
			const tempState = JSON.parse(JSON.stringify(state));
			matches.forEach(function (index) {
				tempState.tiles[index] = 0;
			});
			const unattached = findUnattached(tempState);
			if (unattached.length) {
				state.popped.push(unattached);
			}
		}
	}
	return state;
};

const getScore = (length) => {
	// mvp lol
	const baseLine = 10;
	return baseLine * length;
};

/*

	SNOOD SCORING

	match 3: 10
	match 4: 17
	match 5: 26
	match 6: 37
	match 7: 50
	match 8: 65
	goes up by 7+2(n)

	dropped 1: 10
	dropped 2: 40
	dropped 3: 90
	dropped 4: 160
	dropped 5: 250
	dropped 6: 360
	dropped 7: 490
	dropped 8: 640
	goes up by 30+20(n)

	completion bonus: 1000

*/

/* PROPER STUFF NOW */

const defaultConfig = {
	rowSize: 4, // topmost row; fattest row (REQUIRED)
	rowCount: 3, // number of rows filled randomly from top
	levelHeight: 7, // NOTE: the last row is "out of bounds"
	colorCount: 4,
	totalColors: 9, // number of tiles in bubble tileset
	randomizeColors: true, // scrambles the colors themselves
	dangerRamp: 5, // number of shots before the ceiling advances
	importFromTiled: false, // removes extra tile for skinny rows
	tiles: [],
	// Tiles provided above will pass through but random tiles will be placed until the rowCount is achieved. If using entirely custom tiles, best to set rowCount to 0.
};

const makeGameState = (userConfig) => {
	const config = Object.assign({}, defaultConfig, userConfig);
	config.tiles = config.tiles.slice(); // break shared reference
	// cleaning Tiled arrays
	if (config.importFromTiled) {
		config.tiles = cleanFromTiled(config.tiles, config.rowSize);
	}
	// color stuffs
	let colorHat = [];
	for (let i = 1; i <= config.totalColors; i++) {
		colorHat.push(i);
	}
	let colorMap = {};
	for (let i = 1; i <= config.colorCount; i++) {
		let value = i;
		if (config.randomizeColors) {
			const rando = Math.floor(Math.random() * colorHat.length);
			value = colorHat[rando];
			colorHat.splice(rando, 1);
		}
		colorMap[i] = value;
	}
	const getRandomTile = () => {
		const rando = Math.ceil(Math.random() * config.colorCount);
		return colorMap[rando];
	};
	// making fresh map
	let tiles = config.tiles;
	let row = 0;
	let col = 0;
	while (row < config.levelHeight) {
		const index = getIndex([row,col], config.rowSize);
		if (index === false) {
			row += 1;
			col = 0;
		} else {
			if (!tiles[index]) {
				if (row < config.rowCount) {
					tiles[index] = getRandomTile();
				} else {
					tiles[index] = 0;
				}
			}
			col +=1;
		}
	}
	const state = {
		rowSize: config.rowSize,
		levelHeight: config.levelHeight,
		dangerRamp: config.dangerRamp,
		dangerState: 0,
		lowered: 0,
		score: 0,
		tiles,
		popped: [],
	};
	state.queue = [
		getRandomBubbleFromState(state),
		getRandomBubbleFromState(state),
	];
	console.log('New game board:');
	printGameBoard(state);
	return {
		state,
		placeBubbleAtIndex (index) {
			const bubble = state.queue[0];
			const success = placeBubble(index, bubble, state);
			if (success) { // if it's a legal move
				// advance bubble queue
				state.queue.shift();
				state.queue.push(getRandomBubbleFromState(state));
				return state;
			} else {
				return false;
			}
		},
		getDanger () {
			return state.dangerState / state.dangerRamp;
		},
		resolvePops () {
			if (state.popped.length) {
				state.score += getScore(state.popped[0].length);
				const popped = state.popped.shift();
				popped.forEach(function (index) {
					state.tiles[index] = 0;
				});
				return popped;
			} else {
				return false;
			}
		},
		printGameBoard () { // (A) tiles + (B) queue
			printGameBoard(state);
		},
		printGameMeta () { // (C) danger + (D) score
			printGameMeta(state);
		},
		printGameState () {
			printGameBoard(state); // (A) tiles + (B) queue
			printGameMeta(state); // (C) danger + (D) score
		},
		advanceDangerLevel () {
			advanceDangerLevel(state);
		},
		isGameOver () {
			if (isGameLost(state)) {
				return -1;
			} else if (isGameWon(state)) {
				return 1;
			} else {
				return 0;
			}
		},
		play (index) { // NOTE: all-in-one test play (in console)
			// 1. placing bubble
			const success = this.placeBubbleAtIndex(index);
			if (success) {
				console.log('BIP');
				printGameBoard(state); // (A) tiles + (B) queue
			}
			// 2. popping bubbles
			while (state.popped.length) {
				const popped = state.popped[0];
				const drawState = JSON.parse(JSON.stringify(state));
				popped.forEach(function (index) {
					drawState.tiles[index] = '!';
				});
				console.log('POP!');
				printGameBoard(drawState); // (A) tiles + (B) queue
				// "animation":
				drawState.tiles = drawState.tiles
					.map((value) => value === '!' ? 0 : value);
				this.resolvePops(state);
				printGameBoard(state); // (A) tiles + (B) queue
			}
			//3. dropping ceiling
			this.advanceDangerLevel();
			if (state.lowered !== 0 && state.dangerState === 0) {
				console.log('KCHONK!');
				printGameBoard(state); // (A) tiles + (B) queue
			}
			// 4. win/lose/continue
			let isOver = this.isGameOver();
			if (isOver === 1) {
				console.log('YOU WIN! Score: ' + state.score); // (D) score
			} else if (isOver === -1) {
				console.log('YOU LOSE! Score: ' + state.score); // (D) score
			} else {
				printGameMeta(state); // (C) danger + (D) score
			}
		},
	};
};

/*

THINGS TO DRAW

A. Tiles
	- game.state.tiles
B. Bubble queue
	- game.state.queue
	- queue[0] is the next shot
C. Danger level
	- game.getDanger()
	- value between 0 and 1
	- 1 means the next shot will advance the ceiling
D. Score
	- game.state.score


TO PLAY THE GAME

1. game.placeBubbleAtIndex(index)
2. While game.state.popped.length
	a. Do fancy animations for indices in game.state.popped[0]
	b. game.resolvePops()
3. game.advanceDangerLevel()
4. game.isGameOver()

*/

let test = makeGameState({dangerRamp: 3});

console.log('breakpoint me lol');

if (typeof window === 'object') {
	window.makeGameState = makeGameState;
}
