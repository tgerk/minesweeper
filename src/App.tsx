import { createSignal, onMount, Show } from "solid-js"
import { render } from "solid-js/web"

import Game, { GameOverEvent } from "./Game"

import styles from "./App.module.css"

export default function App() {
  const [mines, setMines] = createSignal(0),
    [winOrLoss, setWinOrLoss] = createSignal<boolean>()   

  let dispose: ReturnType<typeof render>
  function newGame() {
    setWinOrLoss(undefined)
    dispose?.()
    dispose = render(
      () => <Game x={12} y={16} mines={0.17} setMines={setMines} />,
      document.getElementById("game-holder") as HTMLElement
    )
  }
  onMount(newGame)

  // TODO: add route for settings
  return (
    <div class={styles.App}>
      <header
        class={styles.header}
        on:Game-Over={({ detail: { won }}: GameOverEvent) => setWinOrLoss(won)}
      >
        <button onClick={newGame}>NEW GAME</button>
        <Show
          when={winOrLoss() !== undefined}
          fallback={<p>remaining flags: {mines()}</p>}
        >
          {winOrLoss() ? (
            <span>WINNER, WINNER, CHICKEN DINNER</span>
          ) : (
            <span>waa-waaa</span>
          )}
        </Show>
        <div id="game-holder"></div>
      </header>
    </div>
  )
}
