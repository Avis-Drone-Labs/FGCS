/*
  The modal to edit a checklist
*/

import { Button, Modal, TextInput } from "@mantine/core";
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { RichTextEditor } from '@mantine/tiptap';


// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function EditCheckList({opened, close, nameSet, checkListSet, generateCheckboxListString, generateCheckboxList}) {
  const [name, setName, finaliseName] = nameSet  // Finalise changes it in the selected accordion (ik annoying...)
  const [checkboxList, setCheckboxList] = checkListSet

  const editor = useEditor({
    extensions: [StarterKit],
    content: checkboxList,
    onUpdate: ({ editor }) => {
      setCheckboxList(editor.getHTML());
    },
  });

  return (
    <Modal 
      title="Edit Checklist" 
      opened={opened} 
      onClose={() => close()} 
      styles={{
        content: {
          borderRadius: "0.5rem",
        },
      }}
      size={"xl"}
      centered
    >
      <div className="flex flex-col gap-2">
        {/* Inputs */}
        <h1>Name</h1>
        <TextInput
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />

        <div>
          <h1>Items</h1>
          <h2 className="text-falcongrey-300 text-sm">Bullet point list of items</h2>
        </div>
        <RichTextEditor editor={editor} classNames={{content: "!list-disc"}}>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.BulletList />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content />
        </RichTextEditor>

        {/* Controls */}
        <div className="w-full flex justify-between pt-2">
          <Button 
            onClick={() => {close(); generateCheckboxListString(true)}} 
            variant="filled"
            color={tailwindColors.red[600]}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {finaliseName(name); generateCheckboxList(); close()}} 
            variant="filled"
            color={tailwindColors.green[600]}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}