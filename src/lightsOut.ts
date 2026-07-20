export type Board = boolean[];

export type BoardDimensions = {
  rows: number;
  cols: number;
};

export type SolveResult = {
  presses: number[];
  solvable: boolean;
};

export function getTileCount(dimensions: BoardDimensions) {
  return dimensions.rows * dimensions.cols;
}

export function createEmptyBoard(dimensions: BoardDimensions): Board {
  return Array.from({ length: getTileCount(dimensions) }, () => false);
}

export function indexToPoint(index: number, dimensions: BoardDimensions) {
  return {
    row: Math.floor(index / dimensions.cols),
    col: index % dimensions.cols,
  };
}

export function pointToIndex(row: number, col: number, dimensions: BoardDimensions) {
  return row * dimensions.cols + col;
}

export function getAffectedIndexes(index: number, dimensions: BoardDimensions) {
  const { row, col } = indexToPoint(index, dimensions);
  const points = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  return points
    .filter(
      ([nextRow, nextCol]) =>
        nextRow >= 0 && nextRow < dimensions.rows && nextCol >= 0 && nextCol < dimensions.cols,
    )
    .map(([nextRow, nextCol]) => pointToIndex(nextRow, nextCol, dimensions));
}

export function pressTile(board: Board, index: number, dimensions: BoardDimensions): Board {
  const nextBoard = [...board];

  for (const affectedIndex of getAffectedIndexes(index, dimensions)) {
    nextBoard[affectedIndex] = !nextBoard[affectedIndex];
  }

  return nextBoard;
}

export function createRandomBoard(dimensions: BoardDimensions): Board {
  let board = createEmptyBoard(dimensions);
  const totalTiles = getTileCount(dimensions);

  for (let index = 0; index < totalTiles; index += 1) {
    if (Math.random() > 0.5) {
      board = pressTile(board, index, dimensions);
    }
  }

  return board;
}

export function isSolved(board: Board) {
  return board.every((isOn) => !isOn);
}

export function solveLightsOut(board: Board, dimensions: BoardDimensions): SolveResult {
  const totalTiles = getTileCount(dimensions);
  const matrix = buildAugmentedMatrix(board, dimensions);
  const pivotColumns: number[] = [];
  let pivotRow = 0;

  for (let col = 0; col < totalTiles && pivotRow < totalTiles; col += 1) {
    const rowWithPivot = matrix.findIndex((row, rowIndex) => rowIndex >= pivotRow && row[col] === 1);

    if (rowWithPivot === -1) {
      continue;
    }

    [matrix[pivotRow], matrix[rowWithPivot]] = [matrix[rowWithPivot], matrix[pivotRow]];

    for (let row = 0; row < totalTiles; row += 1) {
      if (row !== pivotRow && matrix[row][col] === 1) {
        xorRows(matrix[row], matrix[pivotRow]);
      }
    }

    pivotColumns.push(col);
    pivotRow += 1;
  }

  for (const row of matrix) {
    const allCoefficientsZero = row.slice(0, totalTiles).every((value) => value === 0);

    if (allCoefficientsZero && row[totalTiles] === 1) {
      return { presses: [], solvable: false };
    }
  }

  const pivotSet = new Set(pivotColumns);
  const freeColumns = Array.from({ length: totalTiles }, (_, index) => index).filter((index) => !pivotSet.has(index));
  const attempts = freeColumns.length <= 16 ? 2 ** freeColumns.length : 1;
  let bestSolution = buildSolution(matrix, pivotColumns, freeColumns, 0, totalTiles);

  for (let mask = 1; mask < attempts; mask += 1) {
    const solution = buildSolution(matrix, pivotColumns, freeColumns, mask, totalTiles);

    if (countPresses(solution) < countPresses(bestSolution)) {
      bestSolution = solution;
    }
  }

  return {
    presses: bestSolution.map((pressed, index) => (pressed ? index : -1)).filter((index) => index !== -1),
    solvable: true,
  };
}

function buildAugmentedMatrix(board: Board, dimensions: BoardDimensions) {
  const totalTiles = getTileCount(dimensions);

  return Array.from({ length: totalTiles }, (_, tileIndex) => {
    const row = Array.from({ length: totalTiles + 1 }, () => 0);

    for (const pressIndex of getAffectedIndexes(tileIndex, dimensions)) {
      row[pressIndex] = 1;
    }

    row[totalTiles] = board[tileIndex] ? 1 : 0;
    return row;
  });
}

function buildSolution(
  matrix: number[][],
  pivotColumns: number[],
  freeColumns: number[],
  mask: number,
  totalTiles: number,
) {
  const solution = Array.from({ length: totalTiles }, () => 0);

  freeColumns.forEach((col, bitIndex) => {
    solution[col] = (mask >> bitIndex) & 1;
  });

  pivotColumns.forEach((pivotCol, rowIndex) => {
    let value = matrix[rowIndex][totalTiles];

    for (const freeCol of freeColumns) {
      value ^= matrix[rowIndex][freeCol] & solution[freeCol];
    }

    solution[pivotCol] = value;
  });

  return solution;
}

function xorRows(target: number[], source: number[]) {
  for (let index = 0; index < target.length; index += 1) {
    target[index] ^= source[index];
  }
}

function countPresses(solution: number[]) {
  return solution.reduce((total, value) => total + value, 0);
}
