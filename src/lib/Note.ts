import { doc, DocumentReference, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import API from './API';
import EventEmitter from './EventEmitter';
import { Block, FlashCard, Permissions, SerializedNote } from './types';
import { v4 } from 'uuid';
import Quill, { Delta } from 'quill';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { throttle } from 'lodash';

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
    this.throttleSave = throttle(
      async () => {
        if (this.hasLocalChanges && this.quill && this.documentRef) {
          const content = this.export(this.quill.getContents());
          console.log('Saving content to Firestore:', content);
          await setDoc(this.documentRef, { content }, { merge: true }).catch(console.error);
          this.emit('update', content);
          this.hasLocalChanges = false;
        }
      },
      1000,
      { leading: false }
    );
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
      // Load initial content from Firestore
      const docSnap = await getDoc(this.documentRef).catch(console.error);
      if (docSnap && docSnap.exists()) {
        console.log(docSnap.data());
        const savedContent = this.import(docSnap.data() as SerializedNote);
        if (savedContent) {
          console.log('Document found, loading content:', savedContent);
          quill.setContents(savedContent);
          this.emit('update', savedContent);
        }
      } else {
        console.log('No document found, starting with empty editor.');
      }

      // Listen for Firestore document updates in real-time
      this.unsubscribe = onSnapshot(this.documentRef, (snapshot) => {
        console.log('Received Firestore snapshot');
        if (snapshot.exists() && this.hasLocalChanges === false) {
          const newContent = this.import(snapshot.data() as SerializedNote);

          if (!this.isEditing) {
            const currentCursorPosition = quill.getSelection()?.index || 0; // Get the current cursor position

            // Apply content update silently to avoid triggering `text-change`
            quill.setContents(newContent, 'silent');

            // Restore cursor position after content update
            quill.setSelection(currentCursorPosition);
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
      console.log('Realtime session stopped.');
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
    this.permissions = note.permissions;
    return this.importBlocks(note.content);
  }

  importBlocks(blocks: Block[], emit = true): Delta {
    this.content = blocks;
    if (emit) this.emit();

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
