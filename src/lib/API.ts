import Note from './Note';
import { SerializedNote } from './types';

export const DEFAULT_DATA: SerializedNote = {
  id: '1',
  title: 'My First Note',
  description: 'This is a sample note',
  content: [
    {
      id: '1',
      type: 'text',
      position: { x: 0, y: 0, zIndex: 0 },
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
  owner: {
    id: '1',
    name: 'John Doe',
    photo: null,
    email: 'john@doe.com',
    usage: null,
    notes: null
  },
  permissions: {
    global: 'edit',
    user: new Map()
  }
};

/**
 * Tools for interacting with the app's REST API.
 * Websocket data is located in the Note class.
 */
class API {
  token: string;
  constructor(token: string) {
    this.token = token;
  }
  /**
   * Log in with a token (i.e. Sign In With Google)
   * @returns API
   */
  static loginByToken(token: string) {
    return new API(token);
  }
  /**
   * Log in with email and password
   * @returns API
   */
  static loginByCredentials(email: string, password: string) {
    // login here
    return new API('token');
  }

  // METHODS
  async getUserNotes(): Promise<SerializedNote[]> {
    return [DEFAULT_DATA];
  }

  async getNoteById(id: string): Promise<Note | null> {
    return new Note(DEFAULT_DATA);
  }
}

export default API;
