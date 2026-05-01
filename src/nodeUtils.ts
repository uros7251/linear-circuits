import { Position } from 'reactflow';

export function getHandlePositions(rotation: number) {
  switch ((rotation || 0) % 360) {
    case 90:
      return { first: Position.Top, second: Position.Bottom };
    case 180:
      return { first: Position.Right, second: Position.Left };
    case 270:
      return { first: Position.Bottom, second: Position.Top };
    default:
      return { first: Position.Left, second: Position.Right };
  }
} 