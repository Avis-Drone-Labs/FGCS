/*
  A component that goes into a FixedSizeList
  Holds 1 parameter and it's values / description
*/

// Custom components, helpers and data
import RowItem from "./rowItem"

export const Row = ({ data, index, style }) => {
  const param = data.params[index]

  return <RowItem param={param} style={style} onChange={data.onChange} />
}
