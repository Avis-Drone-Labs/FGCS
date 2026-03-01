import { useSelector } from "react-redux"
import { selectPoiMarkers } from "../../redux/slices/droneConnectionSlice"
import POIMarker from "./poiMarker"

export default function POIMarkersContainer() {
  const poiMarkers = useSelector(selectPoiMarkers)

  return (
    <>
      {poiMarkers.map((marker) => (
        <POIMarker key={marker.id} {...marker} />
      ))}
    </>
  )
}
