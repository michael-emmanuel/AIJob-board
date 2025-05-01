import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { MenuBar } from './MenuBar';
import TextAlign from '@tiptap/extension-text-align';
import TextUnderline from '@tiptap/extension-underline';
import TextTypography from '@tiptap/extension-typography';

export function JobDescriptionEditor() {
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
  });

  return (
    <div className='w-full border rounded-lg overflow-hidden bg-card'>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
