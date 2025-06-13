import React from 'react';
import { type Editor } from '@tiptap/react';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import { Button, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { TypeBold, TypeItalic, ListUl, ListOl, CodeSlash, Paragraph } from 'react-bootstrap-icons';

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-top p-2 bg-light d-flex flex-wrap">
      <ButtonGroup size="sm" className="me-2 mb-1">
        <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleMark('bold').run()} disabled={!editor.can().chain().focus().toggleMark('bold').run()} active={editor.isActive('bold')}>
          <TypeBold />
        </Button>
        <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleMark('italic').run()} disabled={!editor.can().chain().focus().toggleMark('italic').run()} active={editor.isActive('italic')}>
          <TypeItalic />
        </Button>
        <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleMark('code').run()} disabled={!editor.can().chain().focus().toggleMark('code').run()} active={editor.isActive('code')}>
          <CodeSlash />
        </Button>
      </ButtonGroup>
      <ButtonGroup size="sm" className="me-2 mb-1">
        <Button variant="outline-secondary" onClick={() => editor.chain().focus().setNode('paragraph').run()} active={editor.isActive('paragraph')}><Paragraph/></Button>
        <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>H2</Button>
        <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>H3</Button>
      </ButtonGroup>
      <ButtonGroup size="sm" className="mb-1">
        <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><ListUl/></Button>
        <Button variant="outline-secondary" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOl/></Button>
      </ButtonGroup>
    </div>
  );
};

export default MenuBar;