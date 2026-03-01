import { useSelector } from "react-redux";
import POIMarker from "./poiMarker";
import { selectPoiMarkers } from "../../redux/slices/droneConnectionSlice";

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
