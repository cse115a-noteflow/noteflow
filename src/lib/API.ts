import { FirebaseApp } from 'firebase/app';
import Note from './Note';
import { FailureResponse, PartialNote, SerializedNote } from './types';
import axios from 'axios';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { updateDoc } from "firebase/firestore"
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
      style: {
        formatting: [
          {
            start: 0,
            end: 4,
            color: 'red',
            highlight: '',
            link: null,
            types: ['bold']
          },
          {
            start: 5,
            end: 7,
            color: 'blue',
            highlight: '',
            link: null,
            types: ['italic']
          },
          {
            start: 23,
            end: 35,
            color: 'green',
            highlight: 'brown',
            link: 'https://example.com',
            types: ['underline']
          }
        ],
        align: 'left'
      }
    }
  ],
  owner: '1',
  permissions: {
    global: 'edit',
    user: null
  }
};

const ENDPOINT = 'http://localhost:5000';

interface MediaResponse {
  success: true;
  id: string;
  value: string;
  width: number;
  height: number;
}

/**
 * Tools for interacting with the app's REST API.
 * Websocket data is located in the Note class.
 */
class API {
  app: FirebaseApp;
  constructor(app: FirebaseApp) {
    this.app = app;
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

      const userId = note.api.user?.uid
      if (!userId) return null;
      if (note.owner != userId && note.permissions?.[userId] != "edit" && !note.permissions?.global?.includes("edit")) {
      
        alert("You do not have permission to edit this note.");
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

  async uploadMedia(formData: FormData): Promise<MediaResponse | FailureResponse> {
    const response = await this.POST('/media', formData);
    return response[1] !== null
      ? response[1]
      : { success: false, message: 'Failed to upload media' };
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
      if (!note) return true;
  
      // Owners always have full permissions
      if (note.owner === userId) return true;
  
      // Check global permission first
      if (note.permissions?.global?.includes(permission)) {
        return true;
      }
  
      // Check user-specific permission
      if (note.permissions?.[userId] == (permission)) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  }

  async getNoteById(noteId: string): Promise<PartialNote | null> {
    try {
      const [status, data] = await this.GET(`/notes/${noteId}`);
      if (status !== 200 || !data) return null;
      return data as PartialNote;
    } catch (error) {
      console.error("Error fetching note:", error);
      return null;
    }
  }
}

export default API;
