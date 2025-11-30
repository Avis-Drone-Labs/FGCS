/*
  The modal to edit a checklist
*/

// Native Imports
import { useState } from "react"

// 3rd Party Imports
import { Button, Modal, TextInput } from "@mantine/core"
import { useEditor } from "@tiptap/react"
import BulletList from "@tiptap/extension-bullet-list"
import ListItem from "@tiptap/extension-list-item"
import { RichTextEditor } from "@mantine/tiptap"
import { Node } from "@tiptap/core"

// Redux
import { useDispatch } from "react-redux"
import { setNewChecklistName } from "../../../redux/slices/checklistSlice.js"

export default function EditCheckList({
  opened,
  close,
  passedName,
  checklistId,
  checkListSet,
  generateCheckboxListString,
  generateCheckboxList,
}) {
  const dispatch = useDispatch()
  const [name, setName] = useState(passedName)
  const [checkboxList, setCheckboxList] = checkListSet

  const Document = Node.create({
    name: "doc",
    topNode: true,
    content: "list+",
  })

  const Paragraph = Node.create({
    name: "paragraph",
    group: "block",
    content: "inline*",
    parseHTML() {
      return [{ tag: "p" }]
    },
    renderHTML({ HTMLAttributes }) {
      return ["p", HTMLAttributes, 0]
    },
  })

  const Text = Node.create({
    name: "text",
    group: "inline",
  })

  const editor = useEditor({
    extensions: [Document, Text, Paragraph, BulletList, ListItem],
    content: checkboxList,
    onUpdate: ({ editor }) => {
      setCheckboxList(editor.getHTML())
    },
    autofocus: "end",
  })

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
      <form
        onSubmit={(e) => {
          e.preventDefault()
          dispatch(setNewChecklistName({ id: checklistId, newName: name }))
          generateCheckboxList()
          close()
        }}
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
            <h2 className="text-falcongrey-300 text-sm">
              Bullet point list of items
            </h2>
          </div>
          <RichTextEditor
            editor={editor}
            classNames={{ content: "!list-disc" }}
          >
            {/*
              Going to keep this for future use with code blocks, no need to delete.
              <RichTextEditor.Toolbar sticky stickyOffset={60}>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.BulletList />
                </RichTextEditor.ControlsGroup>
              </RichTextEditor.Toolbar>
            */}

            <RichTextEditor.Content />
          </RichTextEditor>

          {/* Controls */}
          <div className="w-full flex justify-between pt-2">
            <Button
              onClick={() => {
                close()
                generateCheckboxListString(true)
              }}
              variant="filled"
              color={"red"}
            >
              Cancel
            </Button>
            <Button type="submit" variant="filled" color={"green"}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
