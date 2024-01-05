import { createSignal, onMount, Show} from "solid-js"
import { render } from "solid-js/web"

import Game, { GameOverEvent, type HTMLGameElement } from "./Game"

import styles from "./App.module.css"

//TODO: get/set game & user settings from context

export default function App() {
  let gameRef: HTMLGameElement
  const gameProps = { x: 12, y: 16, mines: 0.17 }

  const [mines, setMines] = createSignal<number>(),
    [winOrLoss, setWinOrLoss] = createSignal<boolean>()

  let dispose: ReturnType<typeof render>
  function newGame() {
    // unmount and mount a new game component
    dispose?.()
    dispose = render(
      () => <Game ref={gameRef!} {...gameProps} />,
      document.getElementById("game-holder") as HTMLElement
    )
    // setMines(gameRef.flags) // gameRef is not set or updated until after its own onMount
    setWinOrLoss(undefined)
  }
  onMount(newGame)

  return (
    <div class={styles.App}>
      <header
        class={styles.header}
        on:Game-Over={({ detail: { won } }: GameOverEvent) => setWinOrLoss(won)}
        on:Game-Flag-Update={
          () => setMines(gameRef.flags) /* use a property of the component */
        }
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
