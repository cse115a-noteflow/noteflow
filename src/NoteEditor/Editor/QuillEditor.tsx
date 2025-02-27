import React, { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import Quill, { Delta, Op } from 'quill';
// @ts-expect-error QuillMarkdown is not typed
import QuillMarkdown from 'quilljs-markdown';
import 'quill/dist/quill.snow.css';
import 'quilljs-markdown/dist/quilljs-markdown-common-style.css';
import './QuillEditor.css';

// https://quilljs.com/playground/react

// _QuillEditor is an uncontrolled React component
function _QuillEditor(
  {
    readOnly,
    defaultValue,
    onTextChange,
    onSelectionChange
  }: {
    readOnly?: boolean;
    defaultValue?: Delta | Op[];
    onTextChange?: (...args: unknown[]) => void;
    onSelectionChange?: (...args: unknown[]) => void;
  },
  ref: React.ForwardedRef<Quill | null>
) {
  const containerRef = useRef<null | HTMLDivElement>(null);
  const defaultValueRef = useRef<Delta | Op[]>(defaultValue ?? []);
  const onTextChangeRef = useRef(onTextChange);
  const onSelectionChangeRef = useRef(onSelectionChange);

  useLayoutEffect(() => {
    onTextChangeRef.current = onTextChange;
    onSelectionChangeRef.current = onSelectionChange;
  });

  function setRef(value: Quill | null) {
    if (typeof ref === 'function') {
      ref(value);
    } else if (ref !== null) {
      ref.current = value;
    }
  }

  function getRef() {
    if (typeof ref === 'function') {
      return null;
    }
    return ref ? ref.current : null;
  }

  useEffect(() => {
    getRef()?.enable(!readOnly);
  }, [ref, readOnly]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const editorContainer = container.appendChild(container.ownerDocument.createElement('div'));
    const quill = new Quill(editorContainer, {
      theme: 'snow',
      modules: {
        toolbar: false /*[
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image'],
          ['clean']
        ]*/
      }
    });

    setRef(quill);

    const quillMarkdown = new QuillMarkdown(quill);

    if (defaultValueRef.current) {
      quill.setContents(defaultValueRef.current);
    }

    quill.on(Quill.events.TEXT_CHANGE, (...args) => {
      onTextChangeRef.current?.(...args);
    });

    quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
      onSelectionChangeRef.current?.(...args);
    });

    return () => {
      setRef(null);
      quillMarkdown.destroy();
      container.innerHTML = '';
    };
  }, [ref]);

  return <div ref={containerRef}></div>;
}
const QuillEditor = forwardRef(_QuillEditor);

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;
