import { createSignal, onMount, Show } from "solid-js"
import { render } from "solid-js/web"

import Game from "./Game"
import { GameOverEvent } from "./Game"

import styles from "./App.module.css"

export default function App() {
  const [winOrLoss, setWinOrLoss] = createSignal<boolean>(),
    [flags, setFlags] = createSignal(0)

  onMount(newGame)

  function gameOver(event: GameOverEvent) {
    const {
      detail: { won },
    } = event
    setWinOrLoss(won)
  }

  let dispose: ReturnType<typeof render>
  function newGame() {
    setWinOrLoss(undefined)
    dispose?.()
    dispose = render(
      () => <Game x={12} y={16} mines={0.17} setFlags={setFlags} />,
      document.getElementById("game-holder") as HTMLElement
    )
  }

  return (
    <div class={styles.App} on:Game-Over={gameOver}>
      <header class={styles.header}>
        <button onClick={newGame}>NEW GAME</button>
        <Show
          when={winOrLoss() !== undefined}
          fallback={<p>remaining flags: {flags()}</p>}
        >
          {winOrLoss() ? (
            <span>WINNER, WINNER, CHICKEN DINNER</span>
          ) : (
            <span>waa-waaa</span>
          )}
        </Show>
        <div id="game-holder"></div>
      </header>
      <p>
        √ Minesweeper needs a NxM grid and a difficulty (i.e. probability of
        cells having mines)
      </p>
      <p>√ Layout as a table, or is CSS grid just as good?</p>
      <p>Game state is a matrix, each matrix cell knows</p>
      <ul>
        <li>
          √ has a mine, or number of nearest neighbors with mines -- derived
          from random allocation at game startup
        </li>
        <li>
          √ (classes, but pseudo-elements not working RN) has a flag or is
          exposed
        </li>
      </ul>
      <p>onClick in the table, gameplay proceeds:</p>
      <ul>
        <li>
          √set/remove a flag on a hidden cell --hold mouse down til flag appears
        </li>
        <li>√click (quickly) to expose a cell</li>
        <li>√click exposed cell to play its neighbors (if </li>
        <li>expose a mine: expose all cells</li>
        <li>
          expose a count: expose cell, if count is zero run a spiral search to
          expose all adjacent empty cells and counts on the border
        </li>
        <li>
          click on an exposed count: if the right number of flags are set on
          neighbors, expose the neighbors
        </li>
      </ul>
    </div>
  )
}
