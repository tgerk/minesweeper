import { batch, createEffect, createSignal, Show } from "solid-js"
import type { Setter } from "solid-js"

import GridCoordSet, { GridCoord } from "./utils/GridCoord"

import styles from "./Game.module.css"

const flagClass = styles.flag

// many modes of play regarding first click and mouse operations
// I recall versions where the board first appears with an opened empty space,
//  probably based on a monte carlo search for an empty cell
// The first click on a virgin board could be event that generates mines, and
//  delay computation of content+style of played cell until it is played
// It's unfriendly if first click on virgin board hits a mine: iterate generating
//  mines until the first-selected cell is in an empty space
// Either way, opening empty space on prior to start or on first click takes away
//  from the opening drama--let user do her own monte carlo

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
// events mousedown, click, dblclick need careful mapping
// when there's a dblClick handler, need a timer to delay and potentially
//  cancel an onClick action if dblClick occurs within timeout; does preventDefault
//  have anything to do with it?

// ignore opening move and dblClick complexity for now!
export default function Game(props: {
  x: number //across
  y: number //down
  mines: number
  sensitivity?: number // milliseconds, move this to user context
  setFlags?: Setter<number>
}) {
  let gridRef: HTMLDivElement

  // I've used a variety of accessor methods:
  // 1) for played cells, use a double-indexed 2-d array of booleans
  //  suits the Show component
  // 2) for bombs, use a GridCoordSet utility class
  //  very typescript-y & OO
  // 3) for flagging cells, use classes on DOM elements
  //  fairly old school, performant?
  // 4) recounting neighboring mines is surely non-performant!
  const mineCells = Array(Math.floor(props.x * props.y * props.mines) + 1)
      .fill(true)
      .map(() => {
        const mine = Math.floor(Math.random() * props.x * props.y)
        return [Math.floor(mine / props.x), mine % props.x] as GridCoord
      }),
    mines = new GridCoordSet(mineCells),
    [playedCells, setCells] = createSignal<boolean[][]>(
      Array(props.y).fill(Array(props.x).fill(false))
    ),
    [gameOver, setGameOver] = createSignal<boolean>(false),
    isFlagged = ([i, j]: GridCoord) =>
      (
        gridRef.childNodes[i].childNodes[j] as HTMLDivElement
      ).classList.contains(flagClass),
    isPlayed = ([i, j]: GridCoord) => playedCells()?.[i][j],
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
      ),
    countNeighborFlags = (coord: GridCoord): number =>
      getNeighbors(coord).filter(([i, j]) =>
        (
          gridRef.childNodes[i].childNodes[j] as HTMLDivElement
        ).classList.contains(flagClass)
      ).length,
    countNeighborMines = (coord: GridCoord): number =>
      getNeighbors(coord).filter((neighbor) => mines.has(neighbor)).length

  function selectCell([i, j]: GridCoord, event: MouseEvent): void {
    // short-click plays non-flagged, long-click only sets flag
    // don't set the flag if the cell was played:  either the onClick
    //  handler or the set flag timeout needs to cleanup the other
    const eventTarget = event.target as Element,
      doPlayCell = () => {
        clearTimeout(setFlagTimeout)
        eventTarget.removeEventListener("click", doPlayCell)
        playCell([i, j], eventTarget)
      },
      setFlagTimeout = setTimeout(() => {
        eventTarget.removeEventListener("click", doPlayCell)

        eventTarget.classList.toggle(flagClass)
        props.setFlags?.((count) =>
          eventTarget.classList.contains(flagClass) ? --count : ++count
        )
      }, props.sensitivity ?? 200)

    if (!eventTarget.classList.contains(flagClass)) {
      eventTarget.addEventListener("click", doPlayCell)
    }
  }

  function clickPlayedCell(cell: GridCoord, event: MouseEvent): void {
    if (countNeighborMines(cell) != countNeighborFlags(cell)) {
      console.log("neighboring mines not equal count to flags")
      return
    }

    playNeighborCells(cell)
  }

  function playCell(cell: GridCoord, element: Element) {
    if (element.classList.contains(flagClass) || !isPlayed(cell)) {
      return
    }

    if (mines.has(cell)) {
      alert("You Lose")
      setGameOver(true)
      return
    }

    batch(() => {
      setCells((cells) => {
        const [i, j] = cell
        return cells.map((row, y) =>
          y == i ? row.map((cell, x) => (x == j ? true : cell)) : row
        )
      })

      if (!countNeighborMines(cell)) {
        playNeighborCells(cell)
      }
    })
  }

  function playNeighborCells(start: GridCoord): GridCoordSet | undefined {
    const changedCells = new GridCoordSet(),
      search = [getNeighbors(start)]

    let radius = 1
    do {
      const nextSearch = new GridCoordSet()
      for (const cell of search.shift()!) {
        if (!isFlagged(cell) && !isPlayed(cell)) {
          if (mines.has(cell)) {
            alert("You Lose")
            setGameOver(true)
            return
          }

          changedCells.add(cell)

          if (!countNeighborMines(cell)) {
            getNeighbors(cell)
              .filter(
                (neighbor) =>
                  !changedCells.has(neighbor) &&
                  !isFlagged(cell) &&
                  !isPlayed(cell)
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
      for (const [i, j] of changedCells) {
        played = played.map((row, y) =>
          y !== i ? row : row.map((cell, x) => (x !== j ? cell : true))
        )
      }
      return played
    })
  }

  props.setFlags?.(mines.size)
  
  return (
    <div class={styles.GameGrid} ref={gridRef!}>
      {Array(props.y)
        .fill(null)
        .map((_, i) => (
          <div class={styles.GameRow}>
            {Array(props.x)
              .fill(null)
              .map((_, j) => (
                <Show
                  when={playedCells()?.[i][j] || gameOver()}
                  fallback={
                    <div
                      onMouseDown={[selectCell, [i, j]]}
                      class={`${styles.GameCell} ${styles.hidden}`}
                    />
                  }
                >
                  <div
                    onClick={[clickPlayedCell, [i, j]]}
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
                </Show>
              ))}
          </div>
        ))}
    </div>
  )
}
