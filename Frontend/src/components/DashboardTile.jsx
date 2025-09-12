import { useMemo, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listRequests } from "../api/client";
import { useFetch } from "../hooks/useFetch";
import Loading from "../components/Loading";
import SkeletonList from "../components/SkeletonList";
import EmptyState from "../components/EmptyState";
import DevRoleSwitcher from "../components/DevRoleSwitcher";
import BackgroundSlideshow from "../components/BackgroundSlideshow";
import { VehiclesContext } from "../context/VehiclesContext";
import { useContext } from "react";
import StatusBadge from '../components/StatusBadge'

const api_url = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function DashboardTile({ dispatch }){

  const [vehicle, setVehicle] = useState([])
  const [driver, setDriver] = useState([])
  const [requestor, setRequestor] = useState([])

  useEffect(() => {
    fetch(`${api_url}/users/id/${dispatch.requestor_id}`)
    .then(res => res.json())
    .then(data => setRequestor(data))
    .catch(err => console.error(err.message))

    fetch(`${api_url}/drivers/${dispatch.driver_id}`)
    .then(res => res.json())
    .then(data => setDriver(data[0]))
    .catch(err => console.error(err.message))

    fetch(`${api_url}/vehicles/id/${dispatch.vehicle_id}`)
    .then(res => res.json())
    .then(data => setVehicle(data))
    .catch(err => console.error(err.message))
  }, [dispatch.requestor_id, dispatch.driver_id, dispatch.vehicle_id])

  return (
    <div className="grid gap-3">
        <div key={dispatch.dispatch_id} className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                <strong>Vehicle: </strong>
                <span>{vehicle.bumper_no}</span>
              </span>
              <span>
                <strong>Driver: </strong>
                <span>{driver.last_name}, {driver.first_name}</span>
              </span>
              {dispatch.approved && <StatusBadge status={'APPROVED'} />}
              {!dispatch.approved && <StatusBadge status={'PENDING'} />}
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {new Date(dispatch.start_time).toLocaleString()} → {new Date(dispatch.end_time).toLocaleString()}
            </div>
            <div style={{ fontSize: 13 }}>{dispatch.purpose}</div>
          </div>
        </div>
    </div>
  );
}