export type Board = boolean[];

export type SolveResult = {
  presses: number[];
  solvable: boolean;
};

export function createEmptyBoard(size: number): Board {
  return Array.from({ length: size * size }, () => false);
}

export function indexToPoint(index: number, size: number) {
  return {
    row: Math.floor(index / size),
    col: index % size,
  };
}

export function pointToIndex(row: number, col: number, size: number) {
  return row * size + col;
}

export function getAffectedIndexes(index: number, size: number) {
  const { row, col } = indexToPoint(index, size);
  const points = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  return points
    .filter(([nextRow, nextCol]) => nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size)
    .map(([nextRow, nextCol]) => pointToIndex(nextRow, nextCol, size));
}

export function pressTile(board: Board, index: number, size: number): Board {
  const nextBoard = [...board];

  for (const affectedIndex of getAffectedIndexes(index, size)) {
    nextBoard[affectedIndex] = !nextBoard[affectedIndex];
  }

  return nextBoard;
}

export function createRandomBoard(size: number): Board {
  let board = createEmptyBoard(size);
  const totalTiles = size * size;

  for (let index = 0; index < totalTiles; index += 1) {
    if (Math.random() > 0.5) {
      board = pressTile(board, index, size);
    }
  }

  return board;
}

export function isSolved(board: Board) {
  return board.every((isOn) => !isOn);
}

export function solveLightsOut(board: Board, size: number): SolveResult {
  const totalTiles = size * size;
  const matrix = buildAugmentedMatrix(board, size);
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

function buildAugmentedMatrix(board: Board, size: number) {
  const totalTiles = size * size;

  return Array.from({ length: totalTiles }, (_, tileIndex) => {
    const row = Array.from({ length: totalTiles + 1 }, () => 0);

    for (const pressIndex of getAffectedIndexes(tileIndex, size)) {
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
