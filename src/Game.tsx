import {
  batch,
  createEffect,
  createSignal,
  Index,
  on,
  onMount,
  Show,
} from "solid-js"
import type { Setter } from "solid-js"
import type {} from "solid-js"

import GridCoordSet, { GridCoord } from "./utils/GridCoord"

import styles from "./Game.module.css"

const flagClass = styles.flag

// define a custom event emitted from the component
const GAME_OVER_EVENT_TYPE = "Game-Over"
export class GameOverEvent extends CustomEvent<{ won: boolean }> {
  type!: "Game-Over"
  detail!: { won: boolean }
  constructor(won: boolean) {
    super(GAME_OVER_EVENT_TYPE, {
      bubbles: true, // simply set on:Game-Over attribute (or addEventListener) on a containing DOM element
      composed: true, // cross shadow-DOM boundary
      detail: { won },
    })
  }
}

// setup event handler attribute on:GameOver --FOR STANDARD HTML ELEMENTS
declare module "solid-js" {
  namespace JSX {
    interface CustomEvents {
      GAME_OVER_EVENT_TYPE: GameOverEvent
    }
  }
}

// many modes of play regarding first click and mouse operations
// I recall versions where the board first appears with an opened empty space,
//  probably based on a monte carlo search for an empty cell
// The first click on a virgin board could be event that generates mines, and
//  delay computation of content+style of played cell until it is played
// It's unfriendly if first click on virgin board hits a mine: iterate generating
//  mines until the first-selected cell is in an empty space
// Either way, opening empty space on prior to start or on first click takes away
//  from the opening drama--let user do her own monte carlo
// (ignore opening move and dblClick complexity for now!)

// elementary operations:
//  set/remove flag
//  play a cell (if unplayed and unflagged)
//  play neighbor cells (if played & neighbor flags == neighbor mines)

// story:
//  on a new board, no cells have been played
//  first click causes the mines matrix to rotate until the selected cell is empty
//   the first click will play a cell (obviously not yet played or flagged) that
//   opens an empty space
//  thence:
//   clicks on unplayed cell add / remove flag
//   dblClick will play the cell regardless if previously flagged or un-flagged
//   click on played cell will compare neighbor flags to neighbor mines & if these
//    match will play unplayed & unflagged neighbors

// having issues with alt/ctrl/meta/shift/right clicking
// events mousedown, click, dblclick need careful mapping?
// when there's a dblClick handler, need a timer to delay and potentially
//  cancel an onClick action if dblClick occurs within timeout; does preventDefault
//  have anything to do with it?

// I've used a variety of state-strategies:
// 1) to indicate played cells, use a double-indexed 2-d array of booleans (suits the Show component)
// 2) for bombs, use a GridCoordSet utility class (very typescript-y & OO)
// 3) for flagging cells, use classes on DOM elements (fairly old school, performant? esp. counting neighboring mines??)
//
// I've injected a state-modifier
// I've exported a custom event
export default function Game(props: {
  x: number //across
  y: number //down
  mines: number
  sensitivity?: number // milliseconds, move this to user context
  setFlags?: Setter<number>
}) {
  let gridRef: HTMLDivElement //HTMLGameElement

  // pre-empt "bad things" if properties are changed, container should render a new Game component
  on(
    () => [props.x, props.y, props.mines],
    () => {
      throw Error("Game properties should be static for life of component")
    }
  )

  // pertaining to cells
  const [cells, setCells] = createSignal<boolean[][]>(
      Array(props.y).fill(Array(props.x).fill(false))
    ),
    isPlayed = ([i, j]: GridCoord) => cells()?.[i][j],
    getNeighbors = (coord: GridCoord): GridCoord[] =>
      Array.from(
        // look Mom, a generator!
        (function* ([i, j]: GridCoord): Generator<GridCoord, void, unknown> {
          if (j > 0) {
            if (i > 0) yield [i - 1, j - 1]
            yield [i, j - 1]
            if (i + 1 < props.y) yield [i + 1, j - 1]
          }
          if (i > 0) yield [i - 1, j]
          if (i + 1 < props.y) yield [i + 1, j]
          if (j + 1 < props.x) {
            if (i > 0) yield [i - 1, j + 1]
            yield [i, j + 1]
            if (i + 1 < props.y) yield [i + 1, j + 1]
          }
        })(coord)
      )

  // pertaining to flags
  const toggleFlag = (cell: GridCoord | Element) =>
      props.setFlags?.((count) =>
        (cell instanceof Element
          ? cell
          : (gridRef.childNodes[cell[0]].childNodes[cell[1]] as Element)
        ).classList.toggle(flagClass)
          ? --count
          : ++count
      ),
    isFlagged = (cell: GridCoord | Element) =>
      (cell instanceof Element
        ? cell
        : (gridRef.childNodes[cell[0]].childNodes[cell[1]] as Element)
      ).classList.contains(flagClass),
    countNeighborFlags = (coord: GridCoord): number =>
      getNeighbors(coord).filter(([i, j]) =>
        (
          gridRef.childNodes[i].childNodes[j] as HTMLDivElement
        ).classList.contains(flagClass)
      ).length
  onMount(() => {
    props.setFlags?.(mines.size)
  })

  // pertaining to mines
  const mines = new GridCoordSet(
      Array(Math.floor(props.x * props.y * props.mines) + 1)
        .fill(true)
        .map(() => {
          const mine = Math.floor(Math.random() * props.x * props.y)
          return [Math.floor(mine / props.x), mine % props.x] as GridCoord
        })
    ),
    checkMine = (coord: GridCoord) => {
      if (mines.has(coord)) {
        setGameOver(true)
        gridRef.dispatchEvent(new GameOverEvent(false))
        return true
      }

      return false
    },
    countNeighborMines = (coord: GridCoord): number =>
      getNeighbors(coord).filter((neighbor) => mines.has(neighbor)).length

  // pertaining to play
  function playCell(coord: GridCoord, element: Element) {
    if (isFlagged(element) || isPlayed(coord) || checkMine(coord)) {
      return
    }

    setCells((cells) => {
      const [i, j] = coord
      return cells.map((row, y) =>
        y == i ? row.map((cell, x) => (x == j ? true : cell)) : row
      )
    })

    if (!countNeighborMines(coord)) {
      playNeighborCells(coord)
    }
  }

  function playNeighborCells(start: GridCoord): GridCoordSet | undefined {
    const playedCells = new GridCoordSet(),
      search = [getNeighbors(start)]

    let radius = 1
    do {
      const nextSearch = new GridCoordSet()
      for (const cell of search.shift()!) {
        if (!isFlagged(cell) && !isPlayed(cell)) {
          if (checkMine(cell)) {
            return
          }

          playedCells.add(cell)

          if (!countNeighborMines(cell)) {
            getNeighbors(cell)
              .filter(
                (neighbor) =>
                  !isFlagged(cell) &&
                  !isPlayed(cell) &&
                  !playedCells.has(neighbor)
              )
              .forEach((neighbor) => {
                nextSearch.add(neighbor)
              })
          }
        }
      }

      ++radius, search.push(Array.from(nextSearch.values()))
    } while (search[0].length)

    setCells((played) => {
      for (const [i, j] of playedCells) {
        played = played.map((row, y) =>
          y !== i ? row : row.map((cell, x) => (x !== j ? cell : true))
        )
      }
      return played
    })
  }

  // pertaining to end-of-game
  const [gameOver, setGameOver] = createSignal<boolean | null>(null)
  createEffect(() => {
    if (
      mines.size +
        cells().reduce(
          (played, row) => played + row.filter(Boolean).length,
          0
        ) ==
      props.x * props.y
    ) {
      gridRef.dispatchEvent(new GameOverEvent(true))
    }
  })

  // pertaining to UI
  function UnplayedCell({ i, j }: { i: number; j: number }) {
    function handler([i, j]: GridCoord, event: MouseEvent): void {
      // short-click plays non-flagged or removes flag, long-click only sets flag
      // the click handler or the set flag timeout needs to cleanup the other
      const eventTarget = event.target as Element
      if (isFlagged(eventTarget)) {
        toggleFlag(eventTarget)
        return
      }

      const setFlagTimeout = setTimeout(() => {
          eventTarget.removeEventListener("click", doPlayCell)
          toggleFlag(eventTarget)
        }, props.sensitivity ?? 200),
        doPlayCell = () => {
          clearTimeout(setFlagTimeout)

          batch(() => {
            playCell([i, j], eventTarget)
          })

          eventTarget.removeEventListener("click", doPlayCell)
        }

      eventTarget.addEventListener("click", doPlayCell)
    }

    return (
      <div
        onMouseDown={[handler, [i, j]]}
        class={`${styles.GameCell} ${styles.hidden}`}
      />
    )
  }

  function PlayedCell({ i, j }: { i: number; j: number }) {
    function handler(cell: GridCoord, event: MouseEvent): void {
      if (countNeighborMines(cell) != countNeighborFlags(cell)) {
        return
      }

      batch(() => {
        playNeighborCells(cell)
      })
    }

    return (
      <div
        onClick={[handler, [i, j]]}
        class={`${styles.GameCell} ${
          styles[`neighbors_${countNeighborMines([i, j])}`]
        }`}
        classList={{
          ...(gameOver() && {
            [styles.mine]: mines.has([i, j]),
          }),
        }}
      >
        {countNeighborMines([i, j]) || ""}
      </div>
    )
  }

  return (
    <div ref={gridRef!} class={styles.GameGrid}>
      <Index each={cells()} fallback={<div>Loading...</div>}>
        {(row, i) => (
          <div class={styles.GameRow}>
            <Index each={row()}>
              {(_, j) => (
                <Show
                  when={cells()?.[i][j] || gameOver()}
                  fallback={<UnplayedCell i={i} j={j} />}
                >
                  <PlayedCell i={i} j={j} />
                </Show>
              )}
            </Index>
          </div>
        )}
      </Index>
    </div>
  )
}
