'use client';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextUnderline from '@tiptap/extension-underline';
import TextTypography from '@tiptap/extension-typography';

export function JsonToHtml({ json }: { json: JSONContent }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextUnderline,
      TextTypography,
    ],
    immediatelyRender: false, // tip tap does not work on server side, hence why immediately render set to false
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert',
      },
    },
    editable: false,
    content: json,
  });

  return <EditorContent editor={editor} />;
}
