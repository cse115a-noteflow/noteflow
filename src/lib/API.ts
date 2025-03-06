import { FirebaseApp } from 'firebase/app';
import Note from './Note';
import { PartialNote, SerializedNote } from './types';
import axios from 'axios';
import { User, getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { NotePermissionState } from './types';


export const DEFAULT_DATA: SerializedNote = {
  id: '1',
  title: 'My First Note',
  description: 'This is a sample note',
  content: [
    {
      id: '1',
      type: 'text',
      position: null,
      value: 'This is a sample note. Look, we can have formatting and everything!',
      delta: {
        ops: [{ insert: 'This is a sample note. Look, we can have formatting and everything!\n' }]
      }
    }
  ],
  owner: '1',
  permissions: {
    global: 'edit',
    user: {}
  }
};

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

  async getAuthToken(): Promise<string> {
    const user: User | null = this.auth.currentUser;
    if (!user) {
      console.error("No authenticated user found.");
      return "";
    }
    return await user.getIdToken();
  }

  async generateShareLink(noteId: string, permission: "edit" | "view"): Promise<{ token: string } | null> {
    const authToken = await this.getAuthToken();
    if (!authToken) {
      console.error("Failed to retrieve auth token.");
      return null;
    }
  
    try {
      const response = await this.POST(`/notes/${noteId}/generate-share-link`, {
        permission
      });
  
      if (response[0] !== 200) {
        console.error("Error generating share link:", response[1]);
        return null;
      }
  
      return response[1] as { token: string };
    } catch (error) {
      console.error("Network error generating share link:", error);
      return null;
    }
  }

  async acceptShareLink(shareToken: string): Promise<boolean> {
    const authToken = await this.getAuthToken();
    if (!authToken) {
      console.error("Failed to retrieve auth token.");
      return false;
    }
  
    try {
      const response = await this.POST(`/notes/accept-share-link`, {
        shareToken
      });
  
      if (response[0] !== 200) {
        console.error("Error accepting share link:", response[1]);
        return false;
      }
  
      return true;
    } catch (error) {
      console.error("Network error accepting share link:", error);
      return false;
    }
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
  async getNotes(query?: string, cursor?: string) {
    let url = '/notes';
    const params = [];
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (cursor) params.push(`cursor=${cursor}`);
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
    if (!note.id) {
      // POST - create new note
      const response = await this.POST('/notes', note.serialize());
      if (response[0] !== 200) return null;
      note.id = response[1].id;
    } else {
      const userId = note.api.user?.uid;
      if (!userId) return null;
      if (
        note.owner !== userId &&
        note.permissions.user[userId]?.permission !== 'edit' &&
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
      if (note.permissions.user[userId]?.permission === permission) {
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
