import React from 'react'
import { useState,useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents,useMap } from "react-leaflet";
import axios from "axios"


const center = [20.5937, 78.9629];  //this location is in India

const RealTimeRouting = () => {
  const [currLocation,setCurrLocation]=useState(center);
  const [route,setRoute]=useState([]);
  const [destination, setDestination] = useState(null);
  const [shape, setShape] = useState([]);
  const [travelTime, setTravelTime] = useState(null);
  

  useEffect(() => {
    if (navigator.geolocation) {
      const locationId = navigator.geolocation.watchPosition(
        (loc) => {
          setCurrLocation([loc.coords.latitude, loc.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error.message);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(locationId);
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  const getRoute = async (destination) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${currLocation[1]},${currLocation[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`
    const response = await axios.get(url);
    setRoute(response.data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
    setTravelTime(Math.round((response.data.routes[0].duration)/ 60)); 
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (!destination) {
          setDestination([e.latlng.lat, e.latlng.lng]);
          getRoute([e.latlng.lat, e.latlng.lng]);
        } 
        else {
          setShape((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
        }
      },
    });
    return null;
  };

  const clearShape = () => {
    setShape([]);
  };

  function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
      map.setView(currLocation, 10);
    }, [currLocation, map]);
    return null;
  }

  return (
    <div style={{ width: "800px", height: "600px", border: "1px solid black" , paddingLeft:"10px"}}>
      {travelTime !== null && (
  <div style={{ background: "white", padding: "5px", margin: "5px" }}>
    Estimated Travel Time: {travelTime} min
  </div>
)}
      <MapContainer center={currLocation} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
      <RecenterMap position={currLocation} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Marker for user's current location */}
      <Marker position={currLocation}>
        <Popup>Your Location</Popup>
      </Marker>

      {destination && (
          <Marker position={destination}>
            <Popup>Destination</Popup>
          </Marker>
        )}
      
      {/* Display calculated route */}
      {route.length > 0 && <Polyline positions={route} color="blue" />}

      {shape.length > 0 && <Polyline positions={[...shape, shape[0]]} color="red" />}
      <MapClickHandler />
      </MapContainer>
      <button onClick={clearShape} style={{ marginBottom: "5px" }}>Clear Shapes</button>
    </div>
  )
}

export default RealTimeRouting