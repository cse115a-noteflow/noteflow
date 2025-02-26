import { useEffect, useRef, useState } from 'react';
import Note from '../../../lib/Note';
import type { TextBlock, TextBlock as TextBlockType, TextRange } from '../../../lib/types';
import '../Block.css';

interface TextRangeContent extends TextRange {
  value: string;
}

const DEFAULT_RANGE: TextRange = {
  start: 0,
  end: 0,
  color: '',
  highlight: '',
  link: null,
  types: []
};

const getRangesByText = (value: string, formatting: TextRange[]) => {
  let start = 0;
  const ranges: TextRangeContent[] = [];
  for (let i = 0; i < formatting.length; i++) {
    const range = formatting[i];
    if (range.start > start) {
      ranges.push({
        ...JSON.parse(JSON.stringify(DEFAULT_RANGE)),
        start,
        end: range.start,
        value: value.slice(start, range.start)
      });
    }
    ranges.push({ ...range, value: value.slice(range.start, range.end) });
    start = range.end;
  }
  if (start < value.length || ranges.length === 0) {
    ranges.push({
      ...JSON.parse(JSON.stringify(DEFAULT_RANGE)),
      start,
      end: value.length,
      value: value.slice(start)
    });
  }
  return ranges;
};

function addRange(
  block: TextBlock,
  value: string,
  formatting: TextRange[],
  start?: number,
  formattingOffset = 0
) {
  if (start === undefined) start = block.value.length;
  block.value = block.value.slice(0, start) + value + block.value.slice(start);
  for (const range of block.style.formatting) {
    if (range.start >= start) {
      range.start += value.length;
      range.end += value.length;
    } else if (range.end > start) {
      range.end += value.length;
    }
  }
  for (const range of formatting) {
    if (range.end <= formattingOffset) continue;
    block.style.formatting.push({
      ...range,
      start: Math.max(0, range.start + (start - formattingOffset)),
      end: range.end + (start - formattingOffset)
    });
  }
  return block;
}

function deleteRange(block: TextBlock, start: number, end: number) {
  console.log('delete', start, end);
  if (start === 0 && end === block.value.length) {
    // delete whole value
    block.value = '';
    block.style.formatting = [];
    return block;
  }
  // remove the text
  block.value = block.value.slice(0, start) + block.value.slice(end);
  // remove the formatting
  const newRanges = [];
  for (const range of block.style.formatting) {
    if (range.start >= end) {
      range.start -= end - start;
      range.end -= end - start;
      newRanges.push(range);
    } else if (range.end > start) {
      if (range.start < start) {
        newRanges.push({ ...range, end: range.end - (end - start) });
      }
      // Otherwise, range is completely encapsulated, so don't include it
    } else {
      newRanges.push({ ...range });
    }
  }
  block.style.formatting = newRanges;
  return block;
}

/**
 * Returns the start and end of the caret position.
 * @param editableDiv The div where the caret is
 * @returns [start, end] or null
 */
function getCaretPosition(editableDiv: HTMLDivElement): [number, number] | null {
  const sel = window.getSelection();
  if (sel && sel.rangeCount) {
    const range = sel.getRangeAt(0);
    let offset = 0;
    let start = -1;
    let end = -1;
    for (const elem of editableDiv.children) {
      if (elem === range.startContainer.parentElement) {
        start = offset + range.startOffset;
      }
      if (elem === range.endContainer.parentElement) {
        end = offset + range.endOffset;
        break;
      }
      offset += elem.textContent?.length || 0;
    }
    if (start === -1 || end === -1) {
      return null;
    } else {
      return [start, end];
    }
  }
  return null;
}

function setCaretPosition(editableDiv: HTMLDivElement, start: number, end: number) {
  const range = document.createRange();
  const sel = window.getSelection();
  if (!sel) return;
  let offset = 0;
  for (const elem of editableDiv.children) {
    if (offset + (elem.textContent?.length || 0) >= start) {
      if (elem.childNodes.length === 0) {
        elem.appendChild(document.createTextNode(''));
      }
      range.setStart(elem.childNodes[0], start - offset);
    }
    if (offset + (elem.textContent?.length || 0) >= end) {
      if (elem.childNodes.length === 0) {
        elem.appendChild(document.createTextNode(''));
      }
      range.setEnd(elem.childNodes[0], end - offset);
      break;
    }
    offset += elem.textContent?.length || 0;
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

function TextBlock({ note, block }: { note: Note; block: TextBlockType }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, forceUpdate] = useState(0);
  const ranges = getRangesByText(block.value, block.style.formatting);
  const ref = useRef<HTMLDivElement>(null);
  const [isEditable, setisEditable] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      const userId = note.api.user?.uid;
      if (!userId) return false;
      if (
        note.owner != userId &&
        note.permissions?.[userId] != 'edit' &&
        !note.permissions?.global?.includes('edit')
      ) {
        setisEditable(false);
      } else {
        setisEditable(true);
      }
    }
    checkPermissions();
  }, [note]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (type: string, params?: any) => {
      if (params && params.id === block.id) {
        switch (type) {
          case 'blockUpdate':
            forceUpdate((prev) => prev + 1);
            break;
          case 'focus':
            if (isEditable) {
              setCaretPosition(
                ref.current as HTMLDivElement,
                Math.min(Math.max(0, params.start ?? Infinity), block.value.length),
                Math.min(Math.max(0, params.end ?? params.start ?? Infinity), block.value.length)
              );
            }
            break;
        }
      }
    };
    note.addListener(fn);
    return () => note.removeListener(fn);
  }, [note, block, isEditable]);

  const setPositionAfterRerender = (start: number, end: number) => {
    if (ref.current) setCaretPosition(ref.current, start, end);
    setTimeout(() => {
      if (ref.current) {
        setCaretPosition(ref.current, start, end);
      }
    }, 0);
  };

  function moveToPreviousBlock(createNew = false, cursorPos?: number) {
    const index = note.content.indexOf(block);
    if (index > 0) {
      note.emit('focus', { id: note.content[index - 1].id, start: cursorPos });
    } else {
      if (createNew) {
        const newBlock = note.addTextBlock(true);
        setTimeout(() => note.emit('focus', { id: newBlock.id, start: cursorPos }), 0);
      } else {
        setPositionAfterRerender(0, 0);
      }
    }
  }

  function moveToNextBlock(createNew = false, cursorPos?: number) {
    const index = note.content.indexOf(block);
    if (index + 1 >= note.content.length) {
      if (createNew) {
        const newBlock = note.addTextBlockAfter(block);
        setTimeout(() => note.emit('focus', { id: newBlock.id, start: cursorPos }), 0);
      } else {
        setPositionAfterRerender(block.value.length, block.value.length);
      }
    } else {
      note.emit('focus', { id: note.content[index + 1].id });
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!isEditable) {
      event.preventDefault();
      return;
    }
    if (!ref.current) {
      event.preventDefault();
      return;
    }
    if (event.ctrlKey || event.altKey) return;

    // TAB - Move between blocks
    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        moveToPreviousBlock();
      } else {
        moveToNextBlock();
      }
      return;
    }

    const position = getCaretPosition(ref.current) || [0, 0];

    // TODO: implement multiselection (shift + arrows)
    if (event.key === 'ArrowUp') {
      moveToPreviousBlock(false, position[0]);
    }
    if (event.key === 'ArrowDown') {
      moveToNextBlock(true, position[0]);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      return;
    }

    // Default keys - handle it
    event.preventDefault();

    if (event.key === 'Enter') {
      // Add a new text block
      const valueAfter = block.value.slice(position[1]);
      const newBlock = note.addTextBlockAfter(block);
      addRange(newBlock, valueAfter, block.style.formatting, 0, position[1]);
      deleteRange(block, position[0], block.value.length);
      setTimeout(() => note.emit('focus', { id: newBlock.id, start: 0, end: 0 }), 0);
    } else if (event.key === 'Backspace') {
      // Delete characters
      if (position[0] === 0 && position[1] === 0) {
        // delete the block if empty and at start of block
        const index = note.content.indexOf(block);
        if (note.content.length === 1 || index === 0) return;
        const previousBlock = note.content[index - 1];
        note.deleteBlock(block);
        setTimeout(() => note.emit('focus', { id: previousBlock.id }), 0);
      } else {
        // delete the character before the caret / selection
        if (position[0] === position[1]) {
          position[0] -= 1;
        }
        deleteRange(block, position[0], position[1]);
        setPositionAfterRerender(position[0], position[0]);
      }
    } else if (event.key.length === 1) {
      // Add a character, deleting current selection as necessary
      if (position[0] !== position[1]) {
        deleteRange(block, position[0], position[1]);
      }
      addRange(block, event.key, [], position[0]);
      setPositionAfterRerender(position[0] + 1, position[0] + 1);
    }
    note.emit('blockUpdate', { id: block.id });
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!isEditable) {
      event.preventDefault();
      return;
    }
    if (!ref.current) return;
    const position = getCaretPosition(event.currentTarget as HTMLDivElement) || [0, 0];
    console.log(position, block.value.slice(position[0], position[1]));
  }

  return (
    <div
      ref={ref}
      className={
        'block block-text ' + (note.content.length === 1 && block.value === '' ? 'initial' : '')
      }
      contentEditable={isEditable}
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      {ranges.map((range, index) => {
        const style = {
          color: range.color,
          backgroundColor: range.highlight,
          textDecoration: range.link ? 'underline' : 'none'
        };
        if (range.link) {
          return (
            <a
              className={range.types.join(' ')}
              key={index}
              href={range.link}
              target="_blank"
              rel="noreferrer"
              style={style}
            >
              {range.value}
            </a>
          );
        } else {
          return (
            <span className={range.types.join(' ')} key={index} style={style}>
              {range.value}
            </span>
          );
        }
      })}
    </div>
  );
}

export default TextBlock;
