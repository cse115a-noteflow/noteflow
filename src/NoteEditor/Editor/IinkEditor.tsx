import React, { CSSProperties, forwardRef, useEffect, useRef } from 'react';
import { Editor, InteractiveInkEditor } from 'iink-ts';

// _QuillEditor is an uncontrolled React component
function _IinkEditor(
  { style, height, width }: { style: CSSProperties; height: number; width: number },
  ref: React.ForwardedRef<InteractiveInkEditor | null>
) {
  const containerRef = useRef<null | HTMLDivElement>(null);
  const internalRef = useRef<InteractiveInkEditor | null>(null);

  function setRef(value: InteractiveInkEditor | null) {
    internalRef.current = value;
    if (typeof ref === 'function') {
      ref(value);
    } else if (ref !== null) {
      ref.current = value;
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const editorContainer = container.appendChild(container.ownerDocument.createElement('div'));
    const editorPromise = Editor.load(editorContainer, 'INTERACTIVEINK', {
      configuration: {
        server: {
          applicationKey: '06288352-25d5-4d9c-8830-4906ab40d805',
          hmacKey: '4b2d8ce7-5fcc-49ab-9859-913ae0681331'
        },
        recognition: {
          gesture: {
            enable: false
          }
        },
        rendering: {
          guides: {
            enable: false
          }
        },
        menu: {
          enable: false,
          style: {
            enable: false
          },
          action: {
            enable: false
          },
          context: {
            enable: false
          }
        }
      }
    });

    editorPromise.then((editor) => {
      setRef(editor);
    });

    return () => {
      setRef(null);
      container.innerHTML = '';
    };
  }, [ref]);

  return (
    <div style={{ ...style, height, width }} className="iink-wrapper" ref={containerRef}></div>
  );
}
const IinkEditor = forwardRef(_IinkEditor);

IinkEditor.displayName = 'iinkEditor';

export default IinkEditor;
