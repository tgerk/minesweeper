import type {} from "solid-js"

// setup event handler attribute on:GameOver
declare module "solid-js" {
  namespace JSX {
    interface CustomEvents {
      GAME_OVER_EVENT_TYPE: GameOverEvent
    }
  }
}

const GAME_OVER_EVENT_TYPE = "Game-Over"
export class GameOverEvent extends CustomEvent<{ won: boolean }> {
  type!: "Game-Over"
  detail!: { won: boolean }
  constructor(won: boolean) {
    super(GAME_OVER_EVENT_TYPE, {
      bubbles: true,
      composed: true,
      detail: { won },
    })
  }
}
