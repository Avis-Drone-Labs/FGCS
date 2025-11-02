export function generateCheckListObjectFromHTMLString(
  HTMLString,
  defaultCheck = false,
) {
  var final = []
  HTMLString.split("<li><p>")
    .splice(1)
    .map((element) => {
      var text = element.split("</p>")[0].trim()
      if (text !== "") {
        final.push({
          checked: defaultCheck,
          name: element.split("</p>")[0].trim(),
        })
      }
    })
  return final
}
