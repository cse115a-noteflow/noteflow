import EventEmitter from './EventEmitter';
import {
  Block,
  MediaBlock,
  Permissions,
  ScribbleBlock,
  SerializedNote,
  TextBlock,
  User
} from './types';
import { v4 } from 'uuid';

const DEFAULT_TEXT_BLOCK = {
  id: '',
  type: 'text',
  position: null,
  value: '',
  style: {
    formatting: [],
    align: 'left'
  }
};

const DEFAULT_SCRIBBLE_BLOCK = {
  id: '',
  type: 'scribble',
  position: null,
  value: '',
  width: 0,
  height: 0,
  strokes: []
};

class Note extends EventEmitter {
  id: string;
  title: string;
  description: string;
  content: Block[];
  owner: User;
  permissions: Permissions;

  constructor(note: SerializedNote) {
    super();
    this.id = note.id;
    this.title = note.title;
    this.description = note.description;
    this.content = note.content;
    this.owner = note.owner;
    this.permissions = note.permissions;
  }

  save(): SerializedNote {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      content: this.content,
      owner: this.owner,
      permissions: this.permissions
    };
  }

  setTitle(newTitle: string) {
    this.title = newTitle || 'Unnamed Note';
    this.emit();
  }

  /* Adding content */

  addTextBlock() {
    const newBlock: TextBlock = {
      ...JSON.parse(JSON.stringify(DEFAULT_TEXT_BLOCK)),
      id: v4()
    };
    this.content.push(newBlock);
    this.emit();
    return newBlock;
  }

  addTextBlockAfter(block: Block) {
    const index = this.content.indexOf(block);
    if (index === -1) return this.addTextBlock();
    const newBlock: TextBlock = {
      ...JSON.parse(JSON.stringify(DEFAULT_TEXT_BLOCK)),
      id: v4()
    };
    this.content.splice(index + 1, 0, newBlock);
    this.emit();
    return newBlock;
  }

  addScribbleBlock() {
    const newBlock: ScribbleBlock = {
      ...JSON.parse(JSON.stringify(DEFAULT_SCRIBBLE_BLOCK)),
      id: v4()
    };
    this.content.push(newBlock);
    this.emit();
    return newBlock;
  }

  addMediaBlock(contentUrl: string, contentType: string, width: number, height: number) {
    const newBlock: MediaBlock = {
      id: Math.random().toString(36).slice(2),
      type: 'media',
      position: null,
      value: '',
      contentType,
      contentUrl,
      width,
      height
    };
    this.content.push(newBlock);
    this.emit();
    return newBlock;
  }

  deleteBlock(block: Block) {
    const index = this.content.indexOf(block);
    if (index === -1) return;
    this.content.splice(index, 1);
    this.emit();
  }

  /* Saving content */

  blockUpdate(block: Block) {
    this.emit();
  }
}

export default Note;
