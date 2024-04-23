import RowItem from "./rowItem"

export const Row = ({ data, index, style }) => {
  const param = data.params[index]

  return <RowItem param={param} style={style} onChange={data.onChange} />
}
