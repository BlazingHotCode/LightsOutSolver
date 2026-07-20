import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  createEmptyBoard,
  createRandomBoard,
  indexToPoint,
  isSolved,
  pressTile,
  solveLightsOut,
  type Board,
} from './lightsOut';

const initialSize = 5;

export function App() {
  const [size, setSize] = useState(initialSize);
  const [board, setBoard] = useState<Board>(() => createRandomBoard(initialSize));
  const [solution, setSolution] = useState<number[]>([]);
  const [message, setMessage] = useState('Start by solving this random 5 x 5 board.');
  const solved = isSolved(board);

  function changeSize(nextSize: number) {
    setSize(nextSize);
    setBoard(createRandomBoard(nextSize));
    setSolution([]);
    setMessage(`Generated a solvable ${nextSize} x ${nextSize} puzzle.`);
  }

  function handlePress(index: number) {
    setBoard((currentBoard) => pressTile(currentBoard, index, size));
    setSolution((currentSolution) => currentSolution.filter((pressIndex) => pressIndex !== index));
    setMessage('Board updated. Press Solve when you want a hint path.');
  }

  function solveBoard() {
    const result = solveLightsOut(board, size);

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

    setBoard((currentBoard) => pressTile(currentBoard, nextPress, size));
    setSolution(remainingPresses);
    setMessage(remainingPresses.length === 0 ? 'Solution applied.' : `${remainingPresses.length} press(es) left.`);
  }

  function randomizeBoard() {
    setBoard(createRandomBoard(size));
    setSolution([]);
    setMessage(`Generated a solvable ${size} x ${size} puzzle.`);
  }

  function clearBoard() {
    setBoard(createEmptyBoard(size));
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
            Board size
            <select value={size} onChange={(event) => changeSize(Number(event.target.value))}>
              {[3, 4, 5, 6, 7].map((nextSize) => (
                <option key={nextSize} value={nextSize}>
                  {nextSize} x {nextSize}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={randomizeBoard}>
            Random
          </button>
          <button type="button" onClick={clearBoard}>
            Clear
          </button>
        </div>

        <div className="board" style={{ '--board-size': size } as CSSProperties}>
          {board.map((isOn, index) => {
            const point = indexToPoint(index, size);
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
