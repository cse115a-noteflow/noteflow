interface SerializedNote {
  id: string;
  title: string;
  description: string;
  content: Block[];
  owner: User;
  permissions: Permissions;
}

type PermissionState = 'view' | 'edit';

interface Permissions {
  global: PermissionState | null;
  user: Map<User, PermissionState>;
}

interface Position {
  x: number;
  y: number;
  zIndex: number;
}

type Format = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'math';

interface TextRange {
  start: number;
  end: number;
  color: string;
  highlight: string;
  link: string | null;
  types: Format[];
}

interface TextBlock {
  id: string;
  type: 'text';
  position: Position | null;
  value: string;
  style: {
    formatting: TextRange[];
    align: 'left' | 'center' | 'right';
  };
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

export type {
  SerializedNote,
  Permissions,
  Position,
  Format,
  TextRange,
  TextBlock,
  Stroke,
  ScribbleBlock,
  MediaBlock,
  Block,
  Usage,
  User
};
