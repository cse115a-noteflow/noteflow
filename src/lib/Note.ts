import { doc, DocumentReference, onSnapshot, setDoc } from 'firebase/firestore';
import API from './API';
import EventEmitter from './EventEmitter';
import { Block, FlashCard, Permissions, SerializedNote, SerializedCursor } from './types';
import { v4 } from 'uuid';
import Quill, { Delta } from 'quill';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { throttle } from 'lodash';
import QuillCursors from 'quill-cursors';
import colorFromUID from './colorFromUID';
import diffDeltas from './diffDeltas';

class Note extends EventEmitter {
  id: string;
  title: string;
  description: string;
  content: Block[];
  owner: string;
  permissions: Permissions;
  api: API;
  cursors: { [uid: string]: SerializedCursor };
  // Firestore
  documentRef: DocumentReference | null;
  // Quill
  quill: Quill | null = null;
  hasLocalChanges = false;
  isEditing = false;
  private unsubscribe: (() => void) | null = null;
  private throttleSave: () => void;

  constructor(note: SerializedNote | null, api: API) {
    super();
    if (note) {
      this.id = note.id;
      this.title = note.title;
      this.description = note.description;
      this.cursors = {};
      this.content = note.content;
      this.owner = note.owner;
      this.permissions = note.permissions;
      this.documentRef = doc(api.firestore, 'notes', this.id);
    } else {
      this.id = '';
      this.title = 'Unnamed Note';
      this.description = '';
      this.cursors = {};
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
    this.throttleSave = throttle(async () => {
      if (this.quill && this.documentRef && this.api.user) {
        const saving: { [key: string]: unknown } = {};

        if (this.hasLocalChanges) {
          saving.content = this.export(this.quill.getContents());
        }

        // Set cursor data
        const range = this.quill.getSelection();
        if (range) {
          saving.cursors = {
            [this.api.user.uid]: {
              name: this.api.user.displayName,
              index: range.index,
              length: range.length,
              updatedAt: Date.now()
            }
          };
        }

        if (Object.keys(saving).length === 0) return;

        console.log('Saving content to Firestore:', saving);
        await setDoc(this.documentRef, saving, { merge: true }).catch(console.error);
        this.emit('update', saving);
        this.hasLocalChanges = false;
      }
    }, 1000);
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

  /* Firebase realtime */
  /**
   * Saves a note to the database.
   * If hard save is off, then it will save directly to Firestore.
   * Quill functionality is saved there (cursor position, content).
   * @param hard Do a "hard" save, which also generates AI data. (Default: true)
   * @returns The saved note, or null if the save failed.
   */
  async save(hard = true) {
    if (hard) {
      const result = await this.api.saveNote(this);
      if (result !== null) this.emit('save');
      return result;
    } else {
      console.log('Soft saving...');
      this.throttleSave();
    }
  }

  /**
   * Listens for changes to the note.
   */
  async createSession() {
    if (this.quill && this.documentRef) {
      const quill = this.quill;
      // Initial content is already loaded, so we can start listening for changes

      // Listen for Firestore document updates in real-time
      this.unsubscribe = onSnapshot(this.documentRef, (snapshot) => {
        console.log('Received Firestore snapshot');
        if (snapshot.exists() && this.hasLocalChanges === false) {
          if (!this.isEditing) {
            const currentScrollPosition = quill.container.parentElement?.scrollTop;
            const currentCursorPosition = quill.getSelection(); // Get the current cursor position
            const delta = this.import(snapshot.data() as SerializedNote);

            // Apply content update silently to avoid triggering `text-change`
            //if (currentCursorPosition !== null) quill.setSelection(null, 'silent');
            quill.updateContents(delta, 'silent');

            // Restore cursor position after content update
            if (currentCursorPosition !== null) quill.setSelection(currentCursorPosition, 'silent');

            // Restore scroll position after content update
            if (quill.container.parentElement && currentScrollPosition)
              quill.container.parentElement.scrollTop = currentScrollPosition;
          }
        }
      });

      // Listen for local text changes and save to Firestore
      this.quill.on('text-change', (_delta, _oldDelta, source) => {
        if (source === 'user') {
          this.hasLocalChanges = true; // Mark change as local
          this.isEditing = true;
          this.save(false);

          // Reset editing state after 5 seconds of inactivity
          setTimeout(() => (this.isEditing = false), 5000);
        }
      });
      this.quill.on('selection-change', (_range, _oldRange, source) => {
        if (source === 'user') {
          // Save also handles cursor, won't save if there's no content difference
          this.save(false);
        }
      });
      console.log('Realtime session started.');
    } else if (this.quill) {
      this.emit('realtime-start');
    }
  }

  /**
   * Stop listening for changes to the note.
   */
  destroySession() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.quill?.off('text-change');
      this.quill?.off('selection-change');
      console.log('Realtime session stopped.');
    }
  }

  private updateCursors() {
    const quillCursors = this.quill?.getModule('cursors') as QuillCursors | undefined;
    if (quillCursors !== undefined) {
      for (const cursor of Object.keys(this.cursors)) {
        if (this.api.user?.uid === cursor) continue;
        if (new Date().getTime() - new Date(this.cursors[cursor].updatedAt).getTime() > 30000) {
          quillCursors.removeCursor(cursor);
          continue;
        }
        quillCursors.createCursor(cursor, this.cursors[cursor].name, colorFromUID(cursor));
        quillCursors.moveCursor(cursor, {
          index: this.cursors[cursor].index,
          length: this.cursors[cursor].length
        });
      }
    }
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
      return this.importBlocks(this.content, false);
    }

    // update note
    if (note.id !== this.id) {
      throw new Error('Note ID mismatch');
    }
    this.title = note.title;
    this.description = note.description;
    this.owner = note.owner;
    this.cursors = note.cursors || {};
    this.permissions = note.permissions;
    setTimeout(() => this.updateCursors(), 0);
    return this.importBlocks(note.content);
  }

  importBlocks(blocks: Block[], newData = true): Delta {
    const oldText = this.content.find((x) => x.type === 'text');
    const oldDelta = oldText ? new Delta(oldText.delta) : new Delta();
    const newText = blocks.find((x) => x.type === 'text');
    const newDelta = newText ? new Delta(newText.delta) : new Delta();
    this.content = blocks;
    if (newData) {
      this.emit();
    }
    if (!newData || oldDelta.ops.length === 0) {
      return new Delta(newDelta.ops);
    }

    return diffDeltas(oldDelta, newDelta);
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
