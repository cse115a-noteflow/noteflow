import { FabricJSEditor } from 'fabricjs-react';
import { PSBrush, PSBrushIface } from '@arch-inc/fabricjs-psbrush';
import { BaseBrush, fabric } from 'fabric';
import { ScribbleBlock } from '../../lib/types';

/*
Fabric typings apparently don't support EraseBrush (a module, see npm run-script postinstall),
so there's a lot of type overriding here...
*/

interface BrushSettings {
  width: number;
  color: string;
  opacity: number; // Determines the opacity
  pressureSensitive: boolean; // Determines if pressure sensitivity is enabled (iPad)
  removesFullStrokes: boolean; // Determines if the brush should remove full strokes
}
interface BrushSettingsOptions {
  width?: number;
  color?: string;
  opacity?: number; // Determines the opacity
  pressureSensitive?: boolean; // Determines if pressure sensitivity is enabled (iPad)
  removesFullStrokes?: boolean;
}
interface TextSettings {
  fontFamily: string;
  fontSize: number;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}
interface TextSettingsOptions {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
}
type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'text';
type BrushTool = 'pen' | 'highlighter' | 'eraser';

type Events = 'undo' | 'redo' | 'update';

export default class EditorHandler {
  editor: FabricJSEditor;

  psBrush: PSBrushIface;
  eraseBrush: fabric.BaseBrush;

  // Undo/Redo History
  undoHistory: any[] = [];
  redoHistory: any[] = [];

  // Listeners
  listeners: { [event: string]: Function } = {
    undo: () => {},
    redo: () => {},
    update: () => {}
  };

  visibility: 'public' | 'unlisted' | 'private' = 'public';
  isRemix = false;
  pages: number = 1;

  topics: string[] = [];
  title: string = '';

  currentTool: Tool = 'select';
  settings: { [key: string]: BrushSettings } = {
    pen: {
      width: 5,
      color: '#000000',
      opacity: 1,
      pressureSensitive: false,
      removesFullStrokes: false
    },
    highlighter: {
      width: 10,
      color: '#ffeb3b',
      opacity: 0.5,
      pressureSensitive: false,
      removesFullStrokes: false
    },
    eraser: {
      width: 10,
      color: '#ffffff',
      opacity: 1,
      pressureSensitive: false,
      removesFullStrokes: true
    }
  };
  textSettings: TextSettings = {
    fontFamily: 'Arial',
    fontSize: 12,
    color: '#000000',
    isBold: false,
    isItalic: false,
    isUnderline: false
  };

  // Sort objects by opacity (highlights behind strokes)
  sortByOpacity() {
    this.editor.canvas._objects.sort((a: any, b: any) => {
      return (a.type === 'textbox' ? a.opacity - 0.01 : a.opacity) - b.opacity;
    });
  }

  constructor(editor: FabricJSEditor) {
    this.editor = editor;
    this.psBrush = new PSBrush(editor.canvas);
    this.psBrush.pressureCoeff = 50;
    this.psBrush.pressureIgnoranceOnStart = 16;
    this.psBrush.disableTouch = true;
    this.eraseBrush = new (fabric as any).EraserBrush(editor.canvas);

    this.editor.canvas.freeDrawingBrush = this.psBrush;
    this.editor.canvas.uniformScaling = true;

    this.editor.canvas.on('object:added', ({ target }: any) => {
      if (target && !target.undone && !target.redone && target.selectable && target.evented) {
        // Only update history on new items, not undone/redone items
        this.redoHistory = [];
        this.undoHistory.push({ type: target.type, target: target.saveState() });

        // remove old items after a while
        if (this.undoHistory.length > 100) this.undoHistory.shift();
      }

      this.sortByOpacity();
      this.notify('update');
    });

    this.editor.canvas.on('object:modified', ({ e, action, transform, target }: any) => {
      let objects = target._objects || [target];
      objects.forEach((obj: any) => {
        if (obj.remixed && !obj.modified) {
          obj.opacity = obj.opacity * 2;
          obj['modified'] = true;
        }
      });
    });

    const selection = ({ target }: any) => {
      if (!target || target._objects) return; // only one object should be selected
      if (target.type === 'textbox') {
        // set textbox settings
        this.textSettings = {
          fontFamily: target.fontFamily,
          fontSize: target.fontSize / 2,
          color: target.fill,
          isBold: target.fontWeight === 'bold',
          isItalic: target.fontStyle === 'italic',
          isUnderline: target.underline
        };
      }
    };

    this.editor.canvas.on('selection:created', selection);
    this.editor.canvas.on('selection:updated', selection);

    this.editor.canvas.on('erasing:end', ({ targets, drawables }: any) => {
      // TODO: find a better way to get bounding boxes of lines (not rectangles!)
      if (this.currentTool === 'eraser') {
        this.redoHistory = [];
        targets = targets.filter((t: any) => t.selectable === true);

        if (this.settings[this.currentTool].removesFullStrokes) {
          this.undoHistory.push({
            type: 'eraseFull',
            target: targets.map((t: any) => t.saveState())
          });
          targets.forEach((obj: any) => this.editor.canvas.remove(obj));
        } else {
          this.undoHistory.push({
            type: 'erasePartial',
            target: targets.map((t: any) => t.saveState())
          });
        }
      }
      this.notify('update');
    });
  }

  deleteSelection() {
    let target = this.editor.canvas.getActiveObject();
    if (target) {
      if (target.type === 'activeSelection') {
        // @ts-ignore
        target._objects.forEach((obj: any) => this.editor.canvas.remove(obj));
      }
      this.editor.canvas.remove(target);

      this.editor.canvas.discardActiveObject().renderAll();
    }
  }

  selectAll() {
    this.editor.canvas.discardActiveObject();
    this.editor.canvas.forEachObject((obj: any) => {
      obj.selectable = true;
    });
    this.editor.canvas.renderAll();
  }

  copySelection() {
    const target = this.editor.canvas.getActiveObject();
    if (target) {
      navigator.clipboard.writeText(JSON.stringify(target.toJSON()));
      return true;
    }
    return false;
  }

  cutSelection() {
    if (this.copySelection()) {
      const target = this.editor.canvas.getActiveObject();
      this.editor.canvas.remove(target);
      this.editor.canvas.renderAll();
      return true;
    }
    return false;
  }

  pasteSelection(text: string) {
    if (!text.startsWith('{')) return;
    const json = JSON.parse(text);

    if (json['type'] === 'activeSelection') {
      fabric.util.enlivenObjects(
        json['objects'],
        (objects: any) => {
          objects.forEach((obj: any) => {
            obj.left += json.left;
            obj.top += json.top;
            obj.selected = true;
            this.editor.canvas.add(obj);
          });

          let selection = new fabric.ActiveSelection(objects, { canvas: this.editor.canvas });
          this.editor.canvas.setActiveObject(selection);

          this.editor.canvas.renderAll();
        },
        ''
      );
    }

    return false;
  }

  // Listeners
  setListener(event: Events, callback: () => void) {
    this.listeners[event] = callback;
  }

  notify(event: Events) {
    this.listeners[event]();
  }

  // Loads a draft
  async loadDraft(block: ScribbleBlock, isRemix: boolean) {
    if (!this.editor) return;
    this.editor.canvas.setDimensions({ width: 1240, height: 1754 * this.pages });

    // load
    await new Promise<void>((resolve) => {
      this.editor.canvas.loadFromJSON(
        json,
        () => resolve(),
        (o: any, object: any) => {
          if (isRemix) {
            object['remixed'] = true;
            object.opacity = object.opacity / 2;
          }
        }
      );
    });

    this.editor.canvas.setDimensions({ width: 1240, height: 1754 * this.pages }); // A4 / 2
    // @ts-ignore
    this.editor.canvas.setCurrentDimensions();

    // clear histories added during load
    this.undoHistory = [];
    this.redoHistory = [];
    this.notify('update');
  }

  saveDraft(): ScribbleBlock {
    return {
      id: 2,
      type: 'scribble',
      position: {
        x: 0,
        y: 0
      }
    };
  }

  postJournal(): Promise<{ success: false } | { success: true; journalID: string }> {
    if (!this.isRemix && this.draft) return this.saveDraft();

    // scale journal properly (width: 1240)
    const width = this.editor.canvas.getWidth();
    const height = this.editor.canvas.getHeight();
    const targetWidth = 1240;

    this.editor.canvas._objects.forEach((obj: any) => {
      if (obj['remixed'] && !obj['modified']) {
        obj.opacity = (obj.opacity || 0.5) * 2;
      }

      obj.scaleX /= width / (targetWidth || 1);
      obj.scaleY /= width / (targetWidth || 1);
      obj.left /= width / (targetWidth || 1);
      obj.top /= width / (targetWidth || 1);
      obj.setCoords();
    });
    this.editor.canvas.setDimensions({
      width: targetWidth,
      height: height / (width / (targetWidth || 1))
    }); // A4 / 2

    const journal: Journal = {
      topics: this.topics,
      title:
        this.title ||
        (this.draft && this.isRemix ? 'Remix of ' + this.draft.title : 'Untitled Journal'),
      remixInfo: this.remixInfo,
      visibility: this.visibility,
      isDraft: false,
      pages: this.pages
    };

    // If draft but not remix, update it instead of making a new object
    return API.uploadJournal(
      journal,
      JSON.stringify(this.editor.canvas.toJSON()),
      this.editor.canvas.toSVG(),
      this.generateSVGPreview()
    );
  }

  addPage() {
    this.pages++;
    let scale = 1240 / this.editor.canvas.getWidth();
    this.editor.canvas.setHeight((1754 / scale) * this.pages);

    // Add page divider
    let y = (1754 / scale) * (this.pages - 1);
    let line = new fabric.Line([0, y, this.editor.canvas.getWidth(), y], {
      stroke: '#000',
      selectable: false,
      evented: false,
      strokeDashArray: [5, 5]
    });
    // @ts-ignore -- This is turned into an object, which has this property (we don't want users erasing page breaks)
    line.erasable = false;

    this.editor.canvas.add(line);
    this.editor.canvas.renderAll();
    this.notify('update');
  }

  // --- TEXT ---

  updateTextSettings(settings: TextSettingsOptions) {
    Object.assign(this.textSettings, settings);
    this.applyTextSettings();
  }

  applyTextSettings() {
    const selectedObject = this.editor.canvas.getActiveObject();

    if (selectedObject && selectedObject.type === 'textbox') {
      (selectedObject as any).set({
        fontSize: this.textSettings.fontSize * 2,
        fontFamily: this.textSettings.fontFamily,
        fontWeight: this.textSettings.isBold ? 'bold' : 'normal',
        fontStyle: this.textSettings.isItalic ? 'italic' : 'normal',
        underline: this.textSettings.isUnderline,
        fill: this.textSettings.color
      });
      this.editor.canvas.renderAll();
    }
  }

  addText(initialString?: string, pointerX?: number, pointerY?: number) {
    const text = new fabric.Textbox('', {
      left: pointerX || 10,
      top: pointerY || 100,
      width: this.editor.canvas.getWidth() - (pointerX || 20),
      splitByGrapheme: true,
      lineHeight: 1.1,
      backgroundColor: 'transparent',

      fontSize: this.textSettings.fontSize * 2,
      fontFamily: this.textSettings.fontFamily,
      fontWeight: this.textSettings.isBold ? 'bold' : 'normal',
      fontStyle: this.textSettings.isItalic ? 'italic' : 'normal',
      underline: this.textSettings.isUnderline,
      fill: this.textSettings.color
    });
    this.editor.canvas.add(text);
    this.editor.canvas.setActiveObject(text);
    text.enterEditing();

    if (text.hiddenTextarea) {
      text.hiddenTextarea.focus();
      // set value after the fact so cursor jumps to it
      text.text = initialString || '';
      text.hiddenTextarea.value = initialString || '';
    }
    this.editor.canvas.renderAll();
  }

  updateToolSettings(tool: BrushTool | null, settings: BrushSettingsOptions) {
    if (!tool) tool = this.currentTool as BrushTool;

    if (!this.settings[tool]) return; // not a valid tool

    Object.assign(this.settings[tool], settings);
    this.applyToolSettings(tool);
  }

  applyToolSettings(tool: BrushTool) {
    let brush: BaseBrush | PSBrushIface = tool === 'eraser' ? this.eraseBrush : this.psBrush;
    if (tool === 'eraser') {
      brush.width = this.settings[tool].width;
    } else {
      if (this.settings[tool].pressureSensitive) {
        brush.pressureManager.min = 0.001;
        brush.width = this.settings[tool].width * 4;
      } else {
        brush.pressureManager.min = 1;
        brush.width = this.settings[tool].width * 2;
      }
      brush.color = this.settings[tool].color;
      brush.opacity = this.settings[tool].opacity;
    }
    this.editor.canvas.freeDrawingBrush = brush;
  }

  setTool(tool: Tool) {
    this.currentTool = tool;
    if (['pen', 'highlighter', 'eraser'].includes(tool)) {
      this.editor.canvas.isDrawingMode = true;
      this.applyToolSettings(tool as BrushTool);
    } else {
      this.editor.canvas.isDrawingMode = false;
    }
    if (tool === 'select') {
      this.editor.canvas.selection = true;
      this.editor.canvas.defaultCursor = 'default';
    } else if (tool === 'text') {
      this.editor.canvas.selection = false;
      this.editor.canvas.defaultCursor = 'text';
    }
  }

  setVisibility(visibility: 'public' | 'unlisted' | 'private') {
    this.visibility = visibility;
  }

  setTitle(title: string) {
    this.title = title;
  }

  setTags(tags: string[]) {
    this.topics = tags;
  }

  // UNDO / REDO

  hasUndoHistory() {
    return this.undoHistory.length > 0;
  }
  hasRedoHistory() {
    return this.redoHistory.length > 0;
  }

  undo() {
    const undo = this.undoHistory.pop();
    if (undo) {
      switch (undo.type) {
        case 'erasePartial':
          this.redoHistory.push({
            type: 'erasePartial',
            target: undo.target.map((obj: any) => {
              const erasePath = obj.clipPath._objects[obj.clipPath._objects.length - 1].saveState();

              console.log(obj.clipPath);
              if (obj.clipPath._objects.length > 2) {
                obj.clipPath.removeWithUpdate(erasePath);
                obj.clipPath.dirty = true;
              } else {
                obj.clipPath = null;
              }

              this.editor.canvas.remove(erasePath);

              obj.dirty = true;

              return { target: obj, erasePath };
            })
          });
          break;
        case 'eraseFull':
          this.redoHistory.push({
            type: 'eraseFull',
            target: undo.target.map((obj: any) => {
              // Fabric filters out ".undone", so add custom properties like this
              obj['undone'] = true;

              // Remove the clip path that was used to erase this object (still added even with full eraser)
              if (obj.clipPath && obj.clipPath._objects.length > 2) {
                obj.clipPath.removeWithUpdate(
                  obj.clipPath._objects[obj.clipPath._objects.length - 1]
                );
              } else {
                // if only line and mask, remove everything
                obj.clipPath = null;
              }

              this.editor.canvas.add(obj);
              return { target: obj };
            })
          });
          break;
        default:
          // Stroke was added
          this.editor.canvas.remove(undo.target);
          this.redoHistory.push(undo);
      }

      this.editor.canvas.renderAll();
    }
    this.notify('undo');
  }

  redo() {
    const redo = this.redoHistory.pop();
    if (redo) {
      switch (redo.type) {
        case 'erasePartial':
          this.undoHistory.push({
            type: 'erasePartial',
            target: redo.target.map((obj: any) => {
              // Add the clip path back
              console.log(obj.target);
              if (obj.target.clipPath) {
                obj.target.clipPath.addWithUpdate(obj.erasePath);
              } else {
                // Recreate the group created by the Eraser - MAY NOT BE 100% ACCURATE, causes clipping?
                obj.target.clipPath = new fabric.Group([
                  new fabric.Rect({
                    left: 0,
                    top: 0,
                    width: obj.target.width,
                    height: obj.target.height,
                    fill: 'rgb(0,0,0)',
                    originX: 'center',
                    originY: 'center'
                  }),
                  obj.erasePath
                ]);
              }

              obj.target.dirty = true;

              return obj.target;
            })
          });
          break;
        case 'eraseFull':
          this.undoHistory.push({
            type: 'eraseFull',
            target: redo.target.map((obj: any) => {
              // Fabric filters out ".undone", so add custom properties like this
              this.editor.canvas.remove(obj.target);
              return obj.target;
            })
          });
          break;
        default:
          // Stroke was removed by undo
          redo.target['redone'] = true;
          this.editor.canvas.add(redo.target);
          this.undoHistory.push(redo);
      }

      this.editor.canvas.renderAll();
    }
    this.notify('undo');
  }
}
