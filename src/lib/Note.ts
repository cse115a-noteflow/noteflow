import API from './API';
import EventEmitter from './EventEmitter';
import {
  Block,
  FlashCard,
  MediaBlock,
  Permissions,
  ScribbleBlock,
  SerializedNote,
  TextBlock
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
  owner: string;
  permissions: Permissions;
  createdAt?: number;
  modifiedAt?: number;
  api: API;

  constructor(note: SerializedNote | null, api: API) {
    super();
    if (note) {
      this.id = note.id;
      this.title = note.title;
      this.description = note.description;
      this.content = note.content;
      this.owner = note.owner;
      this.permissions = note.permissions;
      this.createdAt = Date.now();
      this.modifiedAt = Date.now();
    } else {
      this.id = '';
      this.title = 'Unnamed Note';
      this.description = '';
      this.content = [
        {
          id: v4(),
          type: 'text',
          position: null,
          value: '',
          style: {
            formatting: [],
            align: 'left'
          }
        }
      ];
      this.owner = api.user?.uid ?? '';
      this.permissions = {
        global: null,
        user: null
      };
      this.createdAt = Date.now();
      this.modifiedAt = Date.now();
    }
    this.api = api;
  }

  serialize(): SerializedNote {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      content: this.content,
      owner: this.owner,
      permissions: this.permissions
    };
  }

  async save() {
    const result = await this.api.saveNote(this);
    if (result !== null) this.emit('save');
    return result;
  }

  async setTitle(newTitle: string) {
    const userId = this.api.user?.uid;
    if (!userId) return false;
    if (
      this.owner != userId &&
      this.permissions?.[userId] != 'edit' &&
      !this.permissions?.global?.includes('edit')
    ) {
      alert('You do not have permission to edit this note.');
      return;
    }
    this.title = newTitle || 'Unnamed Note';
    this.emit();
  }

  /* Adding content */

  async addTextBlock(start = false, value = '') {
    const userId = this.api.user?.uid;
    if (!userId) return false;
    if (
      this.owner != userId &&
      this.permissions?.[userId] != 'edit' &&
      !this.permissions?.global?.includes('edit')
    ) {
      alert('You do not have permission to edit this note.');
      return;
    }
    const newBlock: TextBlock = {
      ...JSON.parse(JSON.stringify(DEFAULT_TEXT_BLOCK)),
      id: v4(),
      value
    };
    if (start) {
      this.content.unshift(newBlock);
    } else {
      this.content.push(newBlock);
    }
    this.emit();
    return newBlock;
  }

  async addTextBlockAfter(block: Block) {
    const userId = this.api.user?.uid;
    if (!userId) return false;
    if (
      this.owner != userId &&
      this.permissions?.[userId] != 'edit' &&
      !this.permissions?.global?.includes('edit')
    ) {
      alert('You do not have permission to edit this note.');
      return;
    }
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

  async addScribbleBlock() {
    const userId = this.api.user?.uid;
    if (!userId) return false;
    if (
      this.owner != userId &&
      this.permissions?.[userId] != 'edit' &&
      !this.permissions?.global?.includes('edit')
    ) {
      alert('You do not have permission to edit this note.');
      return;
    }
    const newBlock: ScribbleBlock = {
      ...JSON.parse(JSON.stringify(DEFAULT_SCRIBBLE_BLOCK)),
      id: v4()
    };
    this.content.push(newBlock);
    this.emit();
    return newBlock;
  }

  async addMediaBlock(contentUrl: string, contentType: string, width: number, height: number) {
    const userId = this.api.user?.uid;
    if (!userId) return false;
    if (
      this.owner != userId &&
      this.permissions?.[userId] != 'edit' &&
      !this.permissions?.global?.includes('edit')
    ) {
      alert('You do not have permission to edit this note.');
      return;
    }
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

  async deleteBlock(block: Block) {
    const userId = this.api.user?.uid;
    if (!userId) return false;
    if (
      this.owner != userId &&
      this.permissions?.[userId] != 'edit' &&
      !this.permissions?.global?.includes('edit')
    ) {
      alert('You do not have permission to edit this note.');
      return;
    }
    const index = this.content.indexOf(block);
    if (index === -1) return;
    this.content.splice(index, 1);
    this.emit();
  }

  /* Saving content */
  toString(block?: Block) {
    if (!block) return this.value;

    return block.value;
  }

  get value(): string {
    const content = this.content.filter((x) => x.position === null).map((x) => this.toString(x));
    return content.join('\n');
  }

  blockUpdate(block: Block) {
    this.emit();
  }

  /* AI Integrations */
  async search(query: string) {
    return await this.api.search(this.id, query);
  }

  async generateSummary(): Promise<string | null> {
    return await this.api.generateSummary(this.id);
  }

  async generateFlashcards(): Promise<FlashCard[] | null> {
    return await this.api.generateFlashcards(this.id);
  }
}

export default Note;
