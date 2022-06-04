import { createEffect, createSignal, onMount, Show } from "solid-js"

import Game from "./Game"
import { GameOverEvent } from "./GameOverEvent"

import styles from "./App.module.css"

export default function App() {
  const [flags, setFlags] = createSignal(0)
  const [winOrLoss, setWinOrLoss] = createSignal<boolean>()

  // couldn't both export and keep local ref in component
  // fallback to a custom event handler
  // figured out the Typescript formalities: extend interface JSX.CustomEvents
  // then set the event handler attribute on a standard HTML element
  // (if passing as attribute of a component, author needs to wire it up)
  function gameOver(event: GameOverEvent) {
    const {
      detail: { won },
    } = event
    setWinOrLoss(won)
  }

  createEffect(() => console.log(winOrLoss()))

  return (
    <div class={styles.App}>
      <Show when={winOrLoss() !== undefined}>
        {winOrLoss() ? (
          <span>WINNER, WINNER, CHICKEN DINNER</span>
        ) : (
          <span>waa-waaa</span>
        )}
      </Show>
      <header class={styles.header} on:Game-Over={gameOver}>
        <p>remaining flags: {flags()}</p>
        <Game x={8} y={10} mines={0.1} setFlags={setFlags} />
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
