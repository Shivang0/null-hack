// Pixel Office — Type definitions

/** 2D array of hex color strings. Empty string = transparent. */
export type SpriteData = string[][];

/** Tile types for the office grid */
export enum TileType {
  VOID = 0,
  FLOOR = 1,
  FLOOR_ALT = 2,
  WALL = 3,
  CORRIDOR = 4,
  DESK = 5,
}

/** Room/zone definition */
export interface OfficeRoom {
  id: string;
  name: string;
  label: string;
  color: string; // floor tint
  labelColor: string; // label text color
  x: number; // grid col start
  y: number; // grid row start
  width: number; // cols
  height: number; // rows
}

/** Furniture piece placed in the office */
export interface Furniture {
  type: FurnitureType;
  x: number; // grid col
  y: number; // grid row
  facing: "up" | "down" | "left" | "right";
  state?: "on" | "off";
}

export enum FurnitureType {
  DESK = "desk",
  PC = "pc",
  CHAIR = "chair",
  BOOKSHELF = "bookshelf",
  PLANT = "plant",
  PLANT_LARGE = "plant_large",
  SOFA = "sofa",
  TABLE_ROUND = "table_round",
  WHITEBOARD = "whiteboard",
  COFFEE = "coffee",
  BIN = "bin",
  CABINET = "cabinet",
}

/** Character state for animation */
export enum CharacterState {
  IDLE = "idle",
  WALK = "walk",
  TYPE = "type",
  SLEEP = "sleep",
}

/** Direction the character faces */
export type Direction = "up" | "down" | "left" | "right";

/** A character (agent) in the office */
export interface OfficeCharacter {
  id: string;
  name: string;
  color: string; // palette base color
  skinTone: string; // skin color
  hairColor: string; // hair color
  state: CharacterState;
  facing: Direction;
  gridX: number; // current grid position
  gridY: number;
  targetX: number; // movement target
  targetY: number;
  moveProgress: number; // 0..1 interpolation
  path: [number, number][]; // remaining path tiles
  seatX: number; // assigned seat
  seatY: number;
  seatFacing: Direction;
  animFrame: number;
  animTimer: number;
  statusColor: string; // status indicator color
  currentTask?: string;
  bubbleTimer: number; // speech bubble countdown
}

/** Camera state */
export interface Camera {
  x: number; // world pixel offset
  y: number;
  zoom: number; // 1..8
  targetX: number;
  targetY: number;
  targetZoom: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragStartCamX: number;
  dragStartCamY: number;
}

/** Office layout */
export interface OfficeLayout {
  cols: number;
  rows: number;
  tileSize: number;
  rooms: OfficeRoom[];
  furniture: Furniture[];
  walkable: boolean[][]; // precomputed walkability grid
}

/** Time of day for lighting */
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

/** Z-sorted drawable */
export interface ZDrawable {
  zY: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}
