import EventEmitter from './EventEmitter';
import { Block, Permissions, SerializedNote, User } from './types';

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
}

export default Note;
