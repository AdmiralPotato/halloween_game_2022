const gameState = {
	rowSize: 6,
	tiles: `
		5, 5, 5, 3, 3, 2,
		  0, 5, 3, 1, 9,
		0, 0, 5, 5, 2, 9,
		  0, 0, 3, 8, 7
	`.replace(/\s/g,'').split(',')
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
	// test @ index 13
	// should return [ 0, 1, 2, 7, 13, 14 ]
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
	// => [0,1,2,7,13,14]
};
console.log(findContiguousMatches(13, gameState));

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
console.log(testLetterNeighbors('a'));

console.log('lolololo');
