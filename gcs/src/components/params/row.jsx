/*
  A component that goes into a FixedSizeList
  Holds 1 parameter and it's values / description
*/

// Custom components, helpers and data
import RowItem from "./rowItem"

export const Row = ({ index, style }) => {
  return <RowItem index={index} style={style} />
}
