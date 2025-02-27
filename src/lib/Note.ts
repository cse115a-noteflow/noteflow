import { doc, DocumentReference } from 'firebase/firestore';
import API from './API';
import EventEmitter from './EventEmitter';
import { Block, FlashCard, Permissions, SerializedNote } from './types';
import { v4 } from 'uuid';
import { Delta } from 'quill';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

class Note extends EventEmitter {
  id: string;
  title: string;
  description: string;
  content: Block[];
  owner: string;
  permissions: Permissions;
  api: API;
  // Firestore
  documentRef: DocumentReference | null;

  constructor(note: SerializedNote | null, api: API) {
    super();
    if (note) {
      this.id = note.id;
      this.title = note.title;
      this.description = note.description;
      this.content = note.content;
      this.owner = note.owner;
      this.permissions = note.permissions;
      this.documentRef = doc(api.firestore, 'notes', this.id);
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
          delta: { ops: [] }
        }
      ];
      this.owner = api.user?.uid ?? '';
      this.permissions = {
        global: null,
        user: {}
      };
      this.documentRef = null;
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

  async share(emails: { [email: string]: 'edit' | 'view' }, global: 'edit' | 'view' | null) {
    return await this.api.shareNote(this.id, emails, global);
  }

  async setTitle(newTitle: string) {
    const userId = this.api.user?.uid;
    if (!userId) return false;
    if (
      this.owner !== userId &&
      this.permissions.user[userId]?.permission !== 'edit' &&
      this.permissions.global !== 'edit'
    ) {
      alert('You do not have permission to edit this note.');
      return;
    }
    this.title = newTitle || 'Unnamed Note';
    this.emit();
  }

  /* Quill handlers */

  /**
   * Maps Quill .getContents() to blocks.
   * @param content Quill content
   */
  export(content: Delta) {
    // get text from content
    let text = '';
    for (const op of content.ops) {
      if (typeof op.insert === 'string') {
        text += op.insert;
      }
    }

    // compose blocks
    const blocks: Block[] = [
      {
        id: '1',
        type: 'text',
        position: null,
        value: text,
        delta: { ops: content.ops }
      }
      // Scribble layer
    ];

    this.content = blocks;
    this.emit();

    return blocks;
  }

  /**
   * Returns a Quill Delta object from the content.
   */
  import(note?: SerializedNote): Delta {
    if (!note) {
      return this.importBlocks(this.content);
    }

    // update note
    if (note.id !== this.id) {
      throw new Error('Note ID mismatch');
    }
    this.title = note.title;
    this.description = note.description;
    this.owner = note.owner;
    this.permissions = note.permissions;
    return this.importBlocks(note.content);
  }

  importBlocks(blocks: Block[]): Delta {
    this.content = blocks;
    this.emit();

    // return delta
    const text = this.content.find((x) => x.type === 'text');
    const delta = new Delta();
    if (text && text.delta) {
      delta.ops = text.delta.ops;
    }
    return delta;
  }

  async uploadMedia(file: File): Promise<string | null> {
    const storageRef = ref(this.api.storage, `notes/${this.id}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file, {
      cacheControl: 'public,max-age=31536000'
    });
    console.log(snapshot.metadata);
    if (!snapshot) return null;

    return await getDownloadURL(storageRef);
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

  blockUpdate() {
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
