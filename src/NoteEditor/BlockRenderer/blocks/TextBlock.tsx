import Note from '../../../lib/Note';
import type { TextBlock as TextBlockType, TextRange } from '../../../lib/types';

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

function TextBlock({ note, block }: { note: Note; block: TextBlockType }) {
  const getRangesByText = (formatting: TextRange[]) => {
    let start = 0;
    const ranges: TextRangeContent[] = [];
    for (let i = 0; i < formatting.length; i++) {
      const range = formatting[i];
      if (range.start > start) {
        ranges.push({
          ...DEFAULT_RANGE,
          start,
          end: range.start,
          value: block.value.slice(start, range.start)
        });
      }
      ranges.push({ ...range, value: block.value.slice(range.start, range.end) });
      start = range.end;
    }
    if (start < block.value.length) {
      ranges.push({
        ...DEFAULT_RANGE,
        start,
        end: block.value.length,
        value: block.value.slice(start)
      });
    }
    return ranges;
  };

  const ranges = getRangesByText(block.style.formatting);

  return (
    <div className="block block-text">
      {ranges.map((range, index) => {
        return (
          <span key={index} style={{ color: range.color, backgroundColor: range.highlight }}>
            {range.link ? <a href={range.link}>{range.value}</a> : range.value}
          </span>
        );
      })}
    </div>
  );
}

export default TextBlock;
