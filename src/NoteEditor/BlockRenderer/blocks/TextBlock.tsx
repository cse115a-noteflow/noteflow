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

  useEffect(() => {
    const fn = (type: string, params?: unknown) => {
      if (params && params.id === block.id) {
        switch (type) {
          case 'blockUpdate':
            forceUpdate((prev) => prev + 1);
            break;
          case 'focus':
            setCaretPosition(
              ref.current as HTMLDivElement,
              params.start ?? block.value.length,
              params.end ?? block.value.length
            );
            break;
        }
      }
    };
    note.addListener(fn);
    return () => note.removeListener(fn);
  }, [note, block]);

  const setPositionAfterRerender = (start: number, end: number) => {
    if (ref.current) setCaretPosition(ref.current, start, end);
    setTimeout(() => {
      if (ref.current) {
        setCaretPosition(ref.current, start, end);
      }
    }, 0);
  };

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.altKey) return;
    if (!ref.current) {
      event.preventDefault();
      return;
    }
    const position = getCaretPosition(ref.current) || [0, 0];

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      return;
    }

    // Default keys - handle it
    event.preventDefault();

    if (event.key === 'Enter') {
      const valueAfter = block.value.slice(position[1]);
      const newBlock = note.addTextBlockAfter(block);
      addRange(newBlock, valueAfter, block.style.formatting, 0, position[1]);
      deleteRange(block, position[0], block.value.length);
      setTimeout(() => note.emit('focus', { id: newBlock.id, start: 0, end: 0 }), 0);
    } else if (event.key === 'Backspace') {
      if (position[0] === 0 && position[1] === 0) {
        const index = note.content.indexOf(block);
        if (note.content.length === 1 || index === 0) return;
        // delete the block
        const previousBlock = note.content[index - 1];
        note.deleteBlock(block);
        setTimeout(() => note.emit('focus', { id: previousBlock.id }), 0);
      } else {
        if (position[0] === position[1]) {
          position[0] -= 1;
        }
        deleteRange(block, position[0], position[1]);
        setPositionAfterRerender(position[0], position[0]);
      }
    } else if (event.key.length === 1) {
      addRange(block, event.key, [], position[0]);
      setPositionAfterRerender(position[0] + 1, position[1] + 1);
    }
    note.emit('blockUpdate', { id: block.id });
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const position = getCaretPosition(event.currentTarget as HTMLDivElement) || [0, 0];
    console.log(position, block.value.slice(position[0], position[1]));
  }

  return (
    <div
      ref={ref}
      className="block block-text"
      contentEditable
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
            <a key={index} href={range.link} target="_blank" rel="noreferrer" style={style}>
              {range.value}
            </a>
          );
        } else {
          return (
            <span key={index} style={style}>
              {range.value}
            </span>
          );
        }
      })}
    </div>
  );
}

export default TextBlock;
