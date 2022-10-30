let gameState = {
	rowSize: 6,
	tiles: `
		5, 5, 5, 3, 3, 2,
		  0, 5, 3, 1, 9,
		0, 0, 5, 5, 2, 9,
		  0, 0, 3, 8, 7
	`.replace(/\s/g,'').split(',').map((item) => item * 1),
};
let gameStateFloaty = {
	rowSize: 6,
	tiles: `
		5, 5, 0, 0, 3, 2,
		  0, 0, 3, 0, 9,
		0, 0, 5, 5, 0, 0,
		  0, 0, 3, 8, 7
	`.replace(/\s/g,'').split(',').map((item) => item * 1),
};

const cleanFromTiled = (array, toplineSize) => {
	return array.filter((value, index) => (index + 1) % (toplineSize * 2));
};

let gameStateTiled = {
	rowSize: 11,
	tiles: cleanFromTiled([8, 8, 8, 8, 5, 8, 5, 8, 8, 8, 8, 8, 8, 8, 8, 5, 5, 8, 8, 8, 8, 0, 8, 8, 5, 5, 5, 5, 5, 5, 5, 8, 8, 8, 8, 8, 8, 5, 5, 8, 8, 8, 8, 0, 8, 8, 8, 8, 5, 8, 5, 8, 8, 8, 8, 8, 8, 8, 5, 8, 8, 5, 8, 8, 8, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 11),
};

const isFatRow = (index, rowSize) => {
	const doubleDeckerSize = rowSize * 2 - 1;
	const mod = index % doubleDeckerSize;
	return mod < rowSize;
};

// const isTopRow = (index, rowSize) => index < rowSize;

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

const getIndex = (rowCol, rowSize) => {
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

const printGameState = (state) => {
	const tiles = state.tiles;
	let printSize = 0;
	tiles.forEach(function (item) {
		var printie = item + '';
		printSize = Math.max(printSize, printie.length);
	});
	const printTiles = tiles.map(function (item) {
		let printItem = item === 0 ? '.' : item + '';
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

const placeBubble = (placingIndex, bubbleValue, state = gameStateTiled) => {
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
	// let openIndices = [];
	// state.tiles.forEach(function (value, index) {
	// 	if (value === 0) {
	// 		openIndices.push(index);
	// 	}
	// });
	// console.log('\nOpen indices: ' + openIndices.join(', '));
	return state;
};

/* SOME KIND OF UNIT TESTS LOL */

/*
console.log('   CONTIGUOUS MATCHES:');
console.log(findContiguousMatches(13, gameState));
// [ 0, 1, 2, 7, 13, 14 ]

console.log('   ATTACHED BUBBLES:');
console.log(findAttached(gameStateFloaty));
// [ 0, 1, 4, 5, 10 ]

console.log('   UNATTACHED BUBBLES:');
console.log(findUnattached(gameStateFloaty));
// [ 8, 13, 14, 19, 20, 21 ]
*/

/*
const testLetterNeighbors = function (letter) {
	const gameLetters = {
		rowSize: 6,
		tiles: `
			'a', 'b', 'c', 'd', 'e', 'f',
			   'g', 'h', 'i', 'j', 'k',
			'l', 'm', 'n', 'o', 'p', 'q',
			   'r', 's', 't', 'u', 'v'
		`.replace(/[\s']/g,'').split(','),
	};
	const index = gameLetters.tiles.findIndex(function (item) {
		return item === letter;
	});
	if (index >= 0) {
		const neighbors = getNeighborIndices(index, gameLetters.rowSize);
		return neighbors.map(function (index) {
			return gameLetters.tiles[index];
		}).filter(function (item) {
			return item;
		});
	} else {
		return false;
	}
};
console.log('   LETTER TEST:');
console.log(testLetterNeighbors('a'));
// ['b', 'g']
*/

/* PROPER STUFF NOW */

const defaultConfig = {
	rowSize: 4,
	rowCount: 3,
	levelHeight: 7,
	colorCount: 4,
	totalColors: 9,
	randomizeColors: true,
	dangerRamp: 5,
	tiles: [],
};

const makeGameState = (userConfig) => {
	const config = Object.assign({}, defaultConfig, userConfig);
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
		dangerRamp: config.dangerRamp,
		dangerState: 0,
		lowered: 0,
		tiles,
		popped: [],
	};
	state.queue = [
		getRandomBubbleFromState(state),
		getRandomBubbleFromState(state),
	];
	printGameState(state);
	return {
		state,
		placeBubbleAtIndex (index) {
			printGameState(state);
			const bubble = state.queue[0];
			const success = placeBubble(index, bubble, state);
			if (success) {
				// advance bubble queue
				state.queue.shift();
				state.queue.push(getRandomBubbleFromState(state));
				console.log('\n');
				printGameState(state);
			}
		},
		advanceDanger () {
			state.dangerState += 1;
			if (state.dangerState > state.dangerRamp) {
				state.lowered += 1;
				state.dangerState = 0;
			}
		},
		getDanger () {
			return state.dangerState / state.dangerRamp;
		},
		resolvePops () {
			if (state.popped.length) {
				const popped = state.popped.shift();
				popped.forEach(function (index) {
					state.tiles[index] = '!';
				});
				printGameState(state);
				state.tiles = state.tiles.map((value) => value === '!' ? 0 : value);
				console.log('\n');
				printGameState(state);
				return popped;
			} else {
				return false;
			}
		},
		printGameState,
	};
};

let test = makeGameState();
test.placeBubbleAtIndex(27, test.state.queue[0]);

console.log('breakpoint me lol');
