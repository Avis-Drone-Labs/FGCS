import { showErrorNotification } from "./notification"

export function generateCheckListObjectFromHTMLString(
  HTMLString,
  defaultCheck = false,
) {
  let final = []
  try {
    HTMLString.split("<li><p>")
      .splice(1)
      .forEach((element) => {
        let text = element.split("</p>")[0].trim()
        if (text !== "") {
          final.push({
            checked: defaultCheck,
            name: element.split("</p>")[0].trim(),
          })
        }
      })
  } catch (error) {
    showErrorNotification(
      "Failed to convert to checklist object from HTML string",
    )
  }
  return final
}
