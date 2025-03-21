import { FieldValue } from 'firebase/firestore';
import { Delta } from 'quill';

interface PartialNote {
  id: string;
  title: string;
  description: string;
  owner: string;
  permissions: Permissions;
}

interface SerializedNote extends PartialNote {
  id: string;
  title: string;
  description: string;
  content: Block[];
  owner: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
  cursors?: { [uid: string]: SerializedCursor };
  permissions: Permissions;
}

interface SerializedCursor {
  name: string;
  index: number;
  length: number;
  updatedAt: number;
}

type NotePermissionState = 'view' | 'edit';

interface Permissions {
  global: NotePermissionState | null;
  edit: string[];
  view: string[];
  names: { [uid: string]: string };
}

interface Position {
  x: number;
  y: number;
  zIndex: number;
}

interface TextBlock {
  id: string;
  type: 'text';
  position: Position | null;
  value: string;
  delta: { ops: Delta['ops'] };
}

interface Stroke {
  x: number[];
  y: number[];
  t: number[];
  p: number[];
  color: string;
}

interface ScribbleBlock {
  id: string;
  type: 'scribble';
  position: Position | null;
  value: string;
  width: number;
  height: number;
  strokes: Stroke[];
}

interface MediaBlock {
  id: string;
  type: 'media';
  position: Position | null;
  value: string;
  contentType: string;
  contentUrl: string;
  width: number;
  height: number;
}

type Block = TextBlock | ScribbleBlock | MediaBlock;

interface Usage {
  generations: number;
}

interface User {
  id: string;
  name: string;
  photo: string | null;
  email: string;
  // firebase auth identifier...
  usage: Usage | null;
  notes: SerializedNote[] | null;
}

interface FailureResponse {
  success: false;
  message: string;
}

// Miscellaneous
interface FlashCard {
  term: string;
  definition: string;
}

export type {
  PartialNote,
  SerializedNote,
  SerializedCursor,
  Permissions,
  NotePermissionState,
  Position,
  TextBlock,
  Stroke,
  ScribbleBlock,
  MediaBlock,
  Block,
  Usage,
  User,
  FailureResponse,
  FlashCard
};
