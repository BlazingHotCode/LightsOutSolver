import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  createEmptyBoard,
  createRandomBoard,
  getTileCount,
  indexToPoint,
  isSolved,
  pressTile,
  solveLightsOut,
  type Board,
  type BoardDimensions,
} from './lightsOut';

const initialDimensions = { rows: 5, cols: 5 };
const maxVisibleTiles = 225;

export function App() {
  const [dimensions, setDimensions] = useState<BoardDimensions>(initialDimensions);
  const [board, setBoard] = useState<Board>(() => createRandomBoard(initialDimensions));
  const [solution, setSolution] = useState<number[]>([]);
  const [message, setMessage] = useState('Start by solving this random 5 x 5 board.');
  const solved = isSolved(board);
  const tileCount = getTileCount(dimensions);

  function changeDimension(field: keyof BoardDimensions, value: number) {
    const safeValue = Math.max(1, Math.floor(value) || 1);
    const nextDimensions = { ...dimensions, [field]: safeValue };

    setDimensions(nextDimensions);
    setBoard(createRandomBoard(nextDimensions));
    setSolution([]);
    setMessage(`Generated a solvable ${nextDimensions.rows} x ${nextDimensions.cols} puzzle.`);
  }

  function handlePress(index: number) {
    setBoard((currentBoard) => pressTile(currentBoard, index, dimensions));
    setSolution((currentSolution) => currentSolution.filter((pressIndex) => pressIndex !== index));
    setMessage('Board updated. Press Solve when you want a hint path.');
  }

  function solveBoard() {
    const result = solveLightsOut(board, dimensions);

    if (!result.solvable) {
      setSolution([]);
      setMessage('This custom board has no solution. Try Random or Clear.');
      return;
    }

    setSolution(result.presses);
    setMessage(
      result.presses.length === 0
        ? 'Already solved.'
        : `Solver found ${result.presses.length} press${result.presses.length === 1 ? '' : 'es'}.`,
    );
  }

  function applyNextPress() {
    const [nextPress, ...remainingPresses] = solution;

    if (nextPress === undefined) {
      return;
    }

    setBoard((currentBoard) => pressTile(currentBoard, nextPress, dimensions));
    setSolution(remainingPresses);
    setMessage(remainingPresses.length === 0 ? 'Solution applied.' : `${remainingPresses.length} press(es) left.`);
  }

  function randomizeBoard() {
    setBoard(createRandomBoard(dimensions));
    setSolution([]);
    setMessage(`Generated a solvable ${dimensions.rows} x ${dimensions.cols} puzzle.`);
  }

  function clearBoard() {
    setBoard(createEmptyBoard(dimensions));
    setSolution([]);
    setMessage('Cleared the board. Click tiles to make your own puzzle.');
  }

  return (
    <main className="app-shell">
      <section className="intro-panel">
        <p className="eyebrow">Lights Out Solver</p>
        <h1>Turn every light off.</h1>
        <p className="lede">
          Click a tile to flip it and its neighbors. The solver uses binary Gaussian elimination to find a valid press pattern.
        </p>
        <div className="status-card">
          <span>{solved ? 'Solved' : 'Playing'}</span>
          <strong>{message}</strong>
        </div>
      </section>

      <section className="game-panel" aria-label="Lights Out game">
        <div className="toolbar">
          <label>
            Rows
            <input
              min="1"
              type="number"
              value={dimensions.rows}
              onChange={(event) => changeDimension('rows', Number(event.target.value))}
            />
          </label>
          <label>
            Columns
            <input
              min="1"
              type="number"
              value={dimensions.cols}
              onChange={(event) => changeDimension('cols', Number(event.target.value))}
            />
          </label>
          <button type="button" onClick={randomizeBoard}>
            Random
          </button>
          <button type="button" onClick={clearBoard}>
            Clear
          </button>
        </div>

        <div
          className={`board ${tileCount > maxVisibleTiles ? 'board-compact' : ''}`}
          style={{ '--board-cols': dimensions.cols } as CSSProperties}
        >
          {board.map((isOn, index) => {
            const point = indexToPoint(index, dimensions);
            const hintNumber = solution.indexOf(index) + 1;

            return (
              <button
                aria-label={`Row ${point.row + 1}, column ${point.col + 1}, ${isOn ? 'on' : 'off'}`}
                className={`tile ${isOn ? 'tile-on' : ''} ${hintNumber > 0 ? 'tile-hint' : ''}`}
                key={index}
                onClick={() => handlePress(index)}
                type="button"
              >
                {hintNumber > 0 ? hintNumber : ''}
              </button>
            );
          })}
        </div>

        <div className="actions">
          <button className="primary-action" type="button" onClick={solveBoard}>
            Solve
          </button>
          <button type="button" onClick={applyNextPress} disabled={solution.length === 0}>
            Apply next
          </button>
        </div>

        <p className="hint-text">
          Numbered tiles show one solution order. You can press them yourself or apply the next step automatically.
        </p>
      </section>
    </main>
  );
}
