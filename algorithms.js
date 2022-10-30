const gameState = {
	rowSize: 6,
	tiles: `
		5, 5, 5, 3, 3, 2,
		  0, 5, 3, 1, 9,
		0, 0, 5, 5, 2, 9,
		  0, 0, 3, 8, 7
	`.replace(/\s/g,'').split(',').map((item) => item * 1)
};
const gameStateFloaty = {
	rowSize: 6,
	tiles: `
		5, 5, 0, 0, 3, 2,
		  0, 0, 3, 0, 9,
		0, 0, 5, 5, 0, 0,
		  0, 0, 3, 8, 7
	`.replace(/\s/g,'').split(',').map((item) => item * 1)
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
		getIndex([row + 1, col + 1 + offset], rowSize) // southeast
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

console.log('   CONTIGUOUS MATCHES:');
console.log(findContiguousMatches(13, gameState));
// [ 0, 1, 2, 7, 13, 14 ]

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
				result.push(index);
				queue.push(index);
				crawled[index] = true;
			});
		});
		toCrawl = queue;
		queue = [];
	}
	return result.sort((a, b) => a - b);
};

console.log('   ATTACHED BUBBLES:');
console.log(findAttached(gameStateFloaty));
// [ 0, 1, 4, 5, 10 ]

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

console.log('   UNATTACHED:');
console.log(findUnattached(gameStateFloaty));
// [ 8, 13, 14, 19, 20, 21 ]

const testLetterNeighbors = function (letter) {
	const gameLetters = {
		rowSize: 6,
		tiles: `
			'a', 'b', 'c', 'd', 'e', 'f',
			   'g', 'h', 'i', 'j', 'k',
			'l', 'm', 'n', 'o', 'p', 'q',
			   'r', 's', 't', 'u', 'v'
		`.replace(/[\s']/g,'').split(',')
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

console.log('lolololo');
