import IMouseResult from './IMouseResult';
import { IJsPath } from '@ulixee/js-path';
import IPoint from '../browser/IPoint';
import {IKeyboardShortcut} from "./IKeyboardShortcuts";
import {IKeyboardKeyCode} from "./IKeyboardLayoutUS";

export type IElementInteractVerification = 'elementAtPath' | 'exactElement' | 'none';

export type IInteractionGroups = IInteractionGroup[];
export type IInteractionGroup = IInteractionStep[];

// Interactions

export interface IInteractionStep {
  command: IInteractionCommand;
  mousePosition?: IMousePosition;
  mouseButton?: IMouseButton;
  mouseResultVerifier?: () => Promise<IMouseResult>;
  simulateOptionClickOnNodeId?: number;
  keyboardCommands?: IKeyboardCommand[];
  keyboardDelayBetween?: number;
  keyboardKeyupDelay?: number;
  delayNode?: IJsPath;
  delayElement?: IJsPath;
  delayMillis?: number;
  verification?: IElementInteractVerification;
  relativeToScrollOffset?: IPoint;
}

export enum InteractionCommand {
  move = 'move',
  scroll = 'scroll',

  willDismissDialog = 'willDismissDialog',

  click = 'click',
  clickDown = 'clickDown',
  clickUp = 'clickUp',

  doubleclick = 'doubleclick',

  type = 'type',

  waitForMillis = 'waitForMillis',
}

export type IInteractionCommand = keyof typeof InteractionCommand;

// Mouse-specific Types

export enum MouseButton {
  left = 'left',
  middle = 'middle',
  right = 'right',
}
export type IMouseButton = keyof typeof MouseButton;

export type IMousePositionXY = [number, number];

export function isMousePositionXY(mousePosition: any): boolean {
  return (
    Array.isArray(mousePosition) &&
    mousePosition.length === 2 &&
    typeof mousePosition[0] === 'number' &&
    typeof mousePosition[1] === 'number'
  );
}

export type IMousePosition = IMousePositionXY | IJsPath;

// Keyboard-specific Types

export type IKeyboardCommand = IKeyPress | IKeyboardObject;
export type IKeyboardObject = IKeyboardString | IKeyboardUp | IKeyboardDown | IKeyShortcutPress;
export interface IKeyboardString {
  string: string;
}
export interface IKeyPress {
  keyCode: IKeyboardKeyCode;
}
export interface IKeyShortcutPress {
  shortcut: IKeyboardShortcut;
}
export interface IKeyboardUp {
  up: IKeyboardKeyCode;
}
export interface IKeyboardDown {
  down: IKeyboardKeyCode;
}
