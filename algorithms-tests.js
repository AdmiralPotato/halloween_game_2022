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

let gameStateTiled = {
	rowSize: 11,
	tiles: cleanFromTiled([8, 8, 8, 8, 5, 8, 5, 8, 8, 8, 8, 8, 8, 8, 8, 5, 5, 8, 8, 8, 8, 0, 8, 8, 5, 5, 5, 5, 5, 5, 5, 8, 8, 8, 8, 8, 8, 5, 5, 8, 8, 8, 8, 0, 8, 8, 8, 8, 5, 8, 5, 8, 8, 8, 8, 8, 8, 8, 5, 8, 8, 5, 8, 8, 8, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 11),
};

/* SOME KIND OF UNIT TESTS LOL */

console.log('   CONTIGUOUS MATCHES:');
console.log(findContiguousMatches(13, gameState));
// [ 0, 1, 2, 7, 13, 14 ]

console.log('   ATTACHED BUBBLES:');
console.log(findAttached(gameStateFloaty));
// [ 0, 1, 4, 5, 10 ]

console.log('   UNATTACHED BUBBLES:');
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
