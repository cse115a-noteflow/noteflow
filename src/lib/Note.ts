import { UserInfo } from 'firebase/auth';
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
        user: new Map()
      };
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

  setTitle(newTitle: string) {
    this.title = newTitle || 'Unnamed Note';
    this.emit();
  }

  /* Adding content */

  addTextBlock(start = false) {
    const newBlock: TextBlock = {
      ...JSON.parse(JSON.stringify(DEFAULT_TEXT_BLOCK)),
      id: v4()
    };
    if (start) {
      this.content.unshift(newBlock);
    } else {
      this.content.push(newBlock);
    }
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

  addTextBlockWithString(value: string = '', start = false) {
    const newBlock: TextBlock = {
      ...JSON.parse(JSON.stringify(DEFAULT_TEXT_BLOCK)),
      id: v4(),
      value // ✅ Now accepts a string input
    };

    if (start) {
        this.content.unshift(newBlock);
    } else {
        this.content.push(newBlock);
    }

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

  /**
   * Generates study materials for the note
   * @returns a list of FlashCards, or null if the request failed.
   */
  async summarizeTextBlocks() {
    // Step 1: Collect all text from text blocks
    
    const textBlocks = this.content
        .filter(block => block.type === "text")
        .map(block => (block as TextBlock).value.trim()) // Ensure it's a TextBlock

    // If there's no text, don't make an API call
    
    if (textBlocks.length === 0) {
        
        return;
    }

    // Step 2: Construct a prompt
    const prompt = `Summarize the following text:\n\n${textBlocks.join()}`;

    try {
        // Step 3: Send request to OpenAI
        const response = await fetch("http://127.0.0.1:5000/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: prompt })
        });

        const data = await response.json();
        console.log("Summary Response:", data);

        // Step 4: Add the summary as a new text block
        if (data.success) {
            this.addTextBlockWithString(`Summary:\n\n${data.response.trim()}`);
        } else {
            //this.addTextBlockWithString(`Error: ${data.error || "Failed to generate summary."}`);
        }
    } catch (error) {
          console.error("Error summarizing text blocks:", error);
          //this.addTextBlockWithString("Error: Could not generate summary.");
    }
  }

  async generateFlashCards() {
    // Step 1: Collect all text from text blocks
    
    const textBlocks = this.content
        .filter(block => block.type === "text")
        .map(block => (block as TextBlock).value.trim()) // Ensure it's a TextBlock

    // If there's no text, don't make an API call
    
    if (textBlocks.length === 0) {
        
        return;
    }

    // Step 2: Construct a prompt
    const prompt = `Create a JSON list of quizlet style flashcards based on this text, return no text other than the json list:\n\n${textBlocks.join()}`;

    try {
        // Step 3: Send request to OpenAI
        const response = await fetch("http://127.0.0.1:5000/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: prompt })
        });

        const data = await response.json();
        console.log("Summary Response:", data);

        // Step 4: Add the summary as a new text block
        if (data.success) {
            this.addTextBlockWithString(`${data.response.trim()}`);
        } else {
            //this.addTextBlockWithString(`Error: ${data.error || "Failed to generate summary."}`);
        }
    } catch (error) {
          console.error("Error summarizing text blocks:", error);
          //this.addTextBlockWithString("Error: Could not generate summary.");
    }
  }

  async generateStudyMaterials(): Promise<FlashCard[] | null> {
    // api call
    return [
      {
        term: 'term 1',
        definition: 'definition 1'
      },
      {
        term: 'term 2',
        definition: 'definition 2'
      },
      {
        term: 'term 3',
        definition: 'definition 3'
      }
    ];
  }
}



export default Note;
