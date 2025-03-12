import { FirebaseApp } from 'firebase/app';
import Note from './Note';
import { PartialNote, SerializedNote } from './types';
import axios from 'axios';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, Firestore, getFirestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { NotePermissionState } from './types';

const ENDPOINT =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://server-212131836065.us-west1.run.app';

/**
 * Tools for interacting with the app's REST API.
 * Websocket data is located in the Note class.
 */
class API {
  app: FirebaseApp;
  firestore: Firestore;
  storage: FirebaseStorage;

  constructor(app: FirebaseApp) {
    this.app = app;
    this.firestore = getFirestore(app);
    this.storage = getStorage(app);
  }

  private async POST(path: string, data: unknown, headers?: object) {
    const response = await axios.post(ENDPOINT + path, data, {
      headers: {
        Authorization: 'Bearer ' + (await this.token),
        ...headers
      }
    });

    if (response.status !== 200) {
      return [response.status, null];
    }

    return [response.status, response.data];
  }

  private async PUT(path: string, data: unknown, headers?: object) {
    const response = await axios.put(ENDPOINT + path, data, {
      headers: {
        Authorization: 'Bearer ' + (await this.token),
        ...headers
      }
    });

    if (response.status !== 200) {
      return [response.status, null];
    }

    return [response.status, response.data];
  }

  private async DELETE(path: string, headers?: object) {
    const response = await axios.delete(ENDPOINT + path, {
      headers: {
        Authorization: 'Bearer ' + (await this.token),
        ...headers
      }
    });

    if (response.status !== 200) {
      return [response.status, null];
    }

    return [response.status, response.data];
  }

  private async GET(path: string, headers?: object): Promise<[number, unknown]> {
    const response = await axios.get(ENDPOINT + path, {
      headers: {
        Authorization: 'Bearer ' + (await this.token),
        ...headers
      }
    });

    if (response.status !== 200) {
      return [response.status, null];
    }

    return [response.status, response.data];
  }

  // Firebase
  get user() {
    return this.auth.currentUser;
  }

  get token() {
    return this.user ? this.user.getIdToken() : '';
  }

  get auth() {
    return getAuth(this.app);
  }

  async signInWithGoogle() {
    console.log('Signing in with Google...');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      console.log('Signing in...', this.user);
      await signInWithPopup(this.auth, provider);
      console.log('Signed in!');
      return true;
    } catch (error) {
      console.error('Error signing in: ', error);
    }
    return false;
  }

  signOut() {
    if (!this.user) return false;
    this.auth.signOut();
    return true;
  }

  // METHODS
  async getNotes(query?: string | null, sortOrder: 'asc' | 'desc' = 'asc', cursor?: string | null) {
    let url = '/notes';
    const params = [`sort=${sortOrder}`];
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (cursor) params.push(`cursor=${encodeURIComponent(cursor)}`);
    if (params.length) url += '?' + params.join('&');
    const [status, data] = await this.GET(url);
    if (status !== 200) return null;
    return data as { results: PartialNote[]; cursor: string };
  }

  async getNote(id: string): Promise<Note | null> {
    const response = (await this.GET(`/notes/${id}`)) as [
      number,
      { success: boolean; data: SerializedNote }
    ];
    if (response[0] !== 200) return null;
    return new Note(response[1].data, this);
  }

  async saveNote(note: Note): Promise<Note | null> {
    if (!note.id || note.id.startsWith('DRAFT')) {
      // POST - create new note
      const response = await this.POST('/notes', note.serialize());
      if (response[0] !== 200) return null;
      note.id = response[1].id;

      // add document ref
      note.documentRef = doc(this.firestore, 'notes', response[1].id);
      note.createSession();
    } else {
      const userId = note.api.user?.uid;
      if (!userId) return null;
      if (
        note.owner !== userId &&
        !note.permissions.edit.includes(userId) &&
        note.permissions.global !== 'edit'
      ) {
        alert('You do not have permission to edit this note.');
        return null;
      }

      // PUT - update existing note
      const response = await this.PUT(`/notes/${note.id}`, note.serialize());
      if (response[0] !== 200) return null;
    }
    return note;
  }

  async deleteNote(id: string): Promise<boolean> {
    const response = await this.DELETE(`/notes/${id}`);
    return response[0] === 200;
  }

  async shareNote(
    id: string,
    emails: { [email: string]: 'edit' | 'view' },
    global: 'edit' | 'view' | null
  ) {
    const response = await this.POST(`/notes/${id}/share`, { user: emails, global });

    if (response[0] !== 200) return null;
    return response[1];
  }

  getMediaURL(id: string) {
    return ENDPOINT + '/media/' + id;
  }

  // AI
  async searchNotes(query: string): Promise<SerializedNote[]> {
    const response = await this.GET(`/search?q=${encodeURIComponent(query)}`);
    return (response[1] as { results: SerializedNote[] }).results;
  }

  async search(id: string, query: string): Promise<string | null> {
    const response = await this.GET(`/notes/${id}/search?q=${encodeURIComponent(query)}`);
    return (response[1] as { data: string }).data;
  }

  async generateSummary(id: string, value?: string): Promise<string | null> {
    const response = await this.POST(`/ai/summarize`, { id, value });
    if (response[0] !== 200) return null;
    return (response[1] as { data: string }).data;
  }

  async generateFlashcards(id: string, value?: string) {
    const response = await this.POST(`/ai/flashcards`, { id, value });
    if (response[0] !== 200) return null;
    return (response[1] as { data: Array<{ term: string; definition: string }> }).data;
  }

  /* Permissions */
  async hasPermission(noteId: string, permission: NotePermissionState): Promise<boolean> {
    const userId = this.user?.uid;

    if (!userId) return false;

    try {
      const note = await this.getNoteById(noteId);
      if (!note) return false;

      // Owners always have full permissions
      if (note.owner === userId) return true;

      // Check global permission first
      if (note.permissions.global === permission) {
        return true;
      }

      // Check user-specific permission
      if (note.permissions[permission].includes(userId)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  async getNoteById(noteId: string): Promise<PartialNote | null> {
    try {
      const [status, data] = await this.GET(`/notes/${noteId}`);
      if (status !== 200 || !data) return null;
      return data as PartialNote;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  }
}

export default API;
