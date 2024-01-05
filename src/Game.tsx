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

import { GridCoordSet } from "./utils/GridCoord"
import type { GridCoord } from "./utils/GridCoord"

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

// extend JSX.CustomEvents interface, defines on:Game-Over attribute FOR STANDARD HTML ELEMENTS
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
  setMines?: Setter<number> // probably should be emitting an event
}) {
  let gridRef: HTMLDivElement //HTMLGameElement

  // these props should not change during game, container should instead dispose and re-render this component
  on(
    () => [props.x, props.y, props.mines],
    () => {
      throw Error("Game properties should be static for life of the component")
    }
  )

  // pertaining to cells
  const [cells, setCells] = createSignal<boolean[][]>(
      Array(props.y).fill(Array(props.x).fill(false))
    ),
    isPlayed = ([i, j]: GridCoord) => cells()[i][j],
    setPlayed = (cells: boolean[][], [i, j]: GridCoord) =>
      cells.map((row, y) =>
        y !== i ? row : row.map((cell, x) => (x !== j ? cell : true))
      ),
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
  const getGridElement = (cell: EventTarget | ChildNode | GridCoord) => {
      if (!(cell instanceof Array)) {
        return cell as HTMLDivElement
      }
    
      const [i, j] = cell
      return gridRef.childNodes[i].childNodes[j] as HTMLDivElement
    },
    toggleFlag = (cell: GridCoord | EventTarget) => {
      const flagged = getGridElement(cell).classList.toggle(flagClass)
      props.setMines?.((count) => (flagged ? --count : ++count))
    },
    isFlagged = (cell: GridCoord | EventTarget) =>
      getGridElement(cell).classList.contains(flagClass),
    countNeighborFlags = (coord: GridCoord): number =>
      getNeighbors(coord).filter(isFlagged).length

  // pertaining to mines
  const mines = new GridCoordSet(
      Array(1 + Math.floor(props.x * props.y * props.mines))
        .fill(true)
        .map(() => {
          const random = Math.floor(Math.random() * props.x * props.y)
          return [Math.floor(random / props.x), random % props.x]
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
  function playCell(coord: GridCoord, element?: EventTarget) {
    if (isFlagged(element ?? coord) || isPlayed(coord) || checkMine(coord))
      return

    setCells((cells) => setPlayed(cells, coord))
    if (!countNeighborMines(coord)) {
      playNeighborCells(coord)
    }
  }

  function playNeighborCells(coord: GridCoord) {
    const played = new GridCoordSet(),
      neighbors = new GridCoordSet(getNeighbors(coord))
    for (const neighbor of neighbors) {
      if (isFlagged(neighbor) || isPlayed(neighbor)) continue
      if (checkMine(neighbor)) return

      played.add(neighbor)
      if (!countNeighborMines(neighbor)) {
        getNeighbors(neighbor)
          .filter(
            (neighbor) =>
              !isFlagged(neighbor) &&
              !isPlayed(neighbor) &&
              !played.has(neighbor)
          )
          .forEach((neighbor) => {
            neighbors.add(neighbor)
          })
      }
    }

    setCells((cells) => Array.from(played).reduce(setPlayed, cells))
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
  onMount(() => {
    props.setMines?.(mines.size)
  })

  function Cell(cellProps: { coord: GridCoord }) {
    function Unplayed() {
      function handler(
        coord: GridCoord,
        { target: eventTarget }: MouseEvent
      ): void {
        if (!eventTarget) return // avert non-null type assertions

        // remove flag if flagged
        if (isFlagged(eventTarget)) {
          toggleFlag(eventTarget)
          return
        }

        // set flag if long-click
        const setFlagTimeout = setTimeout(() => {
          eventTarget.removeEventListener("click", doPlayCell)

          toggleFlag(eventTarget)
        }, props.sensitivity ?? 200)

        // play cell if click event (mouseup after mousedown) comes before long-click timeout
        const doPlayCell = () => {
          clearTimeout(setFlagTimeout)
          eventTarget.removeEventListener("click", doPlayCell)

          batch(() => {
            playCell(coord, eventTarget)
          })
        }
        eventTarget.addEventListener("click", doPlayCell)
      }

      return (
        <div
          onMouseDown={[handler, cellProps.coord]}
          class={`${styles.GameCell} ${styles.hidden}`}
        />
      )
    }

    function Played() {
      function handler(coord: GridCoord, event: MouseEvent): void {
        if (countNeighborMines(coord) != countNeighborFlags(coord)) {
          return
        }

        batch(() => {
          playNeighborCells(coord)
        })
      }

      return (
        <div
          onClick={[handler, cellProps.coord]}
          class={`${styles.GameCell} ${
            styles[`neighbors_${countNeighborMines(cellProps.coord)}`]
          }`}
          classList={{
            ...(gameOver() && {
              [styles.mine]: mines.has(cellProps.coord),
            }),
          }}
        >
          {countNeighborMines(cellProps.coord) || ""}
        </div>
      )
    }

    return (
      <Show
        when={isPlayed(cellProps.coord) || gameOver()}
        fallback={<Unplayed />}
      >
        <Played />
      </Show>
    )
  }

  return (
    <div ref={gridRef!} class={styles.GameGrid}>
      <Index each={Array(props.y).fill(false)}>
        {(_, i) => (
          <div class={styles.GameRow}>
            <Index each={Array(props.x).fill(false)}>
              {(_, j) => <Cell coord={[i, j]} />}
            </Index>
          </div>
        )}
      </Index>
    </div>
  )
}
