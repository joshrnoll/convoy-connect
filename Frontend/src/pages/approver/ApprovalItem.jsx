import React, { useMemo, useRef, useState, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge";
import Popover from "../../components/Popover";
import { getDriverQualTypes } from "../../data/selectors";

export default function ApprovalItem({
  row,
  users,
  vehicles,
  driverQuals,
  dispatch,
}) {
  const id = row.dispatch_id ?? row.id ?? `${row.driver_id}:${row.vehicle_id}`;
  const driver = useMemo(
    () => users.find((u) => u.dod_id === row.driver_id),
    [users, row.driver_id]
  );
  const requestor = useMemo(
    () => users.find((u) => u.dod_id === row.requestor_id),
    [users, row.requestor_id]
  );
  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === row.vehicle_id),
    [vehicles, row.vehicle_id]
  );
  const qualified = Boolean(
    vehicle &&
      driver &&
      (driverQuals[driver.dod_id] || []).includes(vehicle.qual_id)
  );
  const driverQualTypes = useMemo(
    () =>
      getDriverQualTypes({ driverId: driver?.dod_id, driverQuals, vehicles }),
    [driver?.dod_id, driverQuals, vehicles]
  );

  const faultsBtnRef = useRef(null);
  const qualsBtnRef = useRef(null);
  const api_url = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const [openFaults, setOpenFaults] = useState(false);
  const [openQuals, setOpenQuals] = useState(false);
  const [comment, setComment] = useState("");
  const [vehicleFaults, setVehicleFaults] = useState([]);

  useEffect(() => {
    if (vehicle) {
      fetch(`${api_url}/faults/${vehicle.id}`)
        .then((res) => res.json())
        .then((data) => {
          setVehicleFaults(data);
        })
        .catch((err) => console.error(err.message));
    } else {
      setVehicleFaults([]);
    }
  }, [vehicle, api_url]);

  // Replace these with your actual approve/deny logic
  async function handlePost(value) {
    const post = {
      dispatch_id: row.dispatch_id,
      approved: value,
      comments: comment,
    };
    try {
      const res = await fetch("http://localhost:8080/dispatches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(post),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      } else {
        console.log("request success!");
      }

      const data = await res.json();
      console.log("Server response:", data);
    } catch (error) {
      console.error("Error posting data:", error);
    }
  }

  return (
    <div key={id} className="card">
      <div className="card-body space-y-4">
        {/* Vehicle strip with status */}
        <div className="flex relative items-center justify-end-safe gap-44 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-text/70">Vehicle:</span>
            <strong>{vehicle?.bumper_no || "—"}</strong>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-text/70">Company:</span>
            <strong>
              {vehicle?.company || vehicle?.uic?.slice(4, 5) || "—"}
            </strong>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-text/70">Status:</div>
            <StatusBadge status={vehicle?.status || "PENDING"} />
          </div>

          <StatusBadge status={row.approved ? "APPROVED" : "PENDING"} />
        </div>

        {/* Driver + Requester section */}

        <div className="flex relative items-center justify-end-safe gap-26 text-sm">
          {" "}
          <div>
            <strong>Driver:</strong>{" "}
            {driver
              ? `${driver.first_name} ${driver.last_name}`
              : row.driver_id || "—"}
          </div>
          <div>
            <strong>UIC:</strong> {driver?.uic || "—"}
          </div>
          {/* Vehicle Faults tab */}
          <div className="flex items-center gap-2">
            <button
              ref={faultsBtnRef}
              type="button"
              className="btn btn-secondary btn-pill"
              onClick={() => setOpenFaults((v) => !v)}
              disabled={!vehicle}
            >
              Vehicle Faults
            </button>
            Vehicle has faults:
            <span
              className={`badge ${vehicleFaults.length > 0 ? "state-DEADLINED" : "state-FMC"}`}
            >
              {vehicleFaults.length > 0 ? "Yes" : "No"}
            </span>
            <Popover
              anchorRef={faultsBtnRef}
              open={openFaults}
              onClose={() => setOpenFaults(false)}
            >
              <div className="popover-body bg-white rounded-lg shadow-lg p-4 min-w-[260px] max-w-[350px] border border-gray-200">
                <div className="font-bold text-lg mb-2 text-gray-800 flex items-center gap-2">
                  <span role="img" aria-label="warning">
                    🚧
                  </span>{" "}
                  Vehicle Faults
                </div>
                <div className="text-sm text-gray-700">
                  {vehicleFaults.length ? (
                    <ul className="list-disc pl-5 space-y-2">
                      {vehicleFaults.map((fault, idx) => (
                        <li
                          key={fault.fault_id || idx}
                          className="bg-red-50 border border-red-200 rounded px-2 py-1"
                        >
                          <div className="font-semibold text-red-700">
                            {fault.code ? `#${fault.code}` : `Fault ${idx + 1}`}
                          </div>
                          <div>
                            {fault.description || JSON.stringify(fault)}
                          </div>
                          {fault.date_reported && (
                            <div className="text-xs text-gray-500 mt-1">
                              Reported:{" "}
                              {new Date(
                                fault.date_reported
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-green-700 font-semibold flex items-center gap-1">
                      <span role="img" aria-label="check">
                        ✅
                      </span>{" "}
                      No faults reported
                    </div>
                  )}
                </div>
              </div>
            </Popover>
          </div>
          {/* Driver quals tab */}
          <div className="flex items-center gap-2">
            <button
              ref={qualsBtnRef}
              type="button"
              className="btn btn-secondary btn-pill"
              onClick={() => setOpenQuals((v) => !v)}
              disabled={!vehicle}
            >
              Driver Qualifications
            </button>
            Driver Qualified on requested Vehicle:
            <span
              className={`badge ${qualified ? "state-FMC" : "state-DEADLINED"}`}
            >
              {qualified ? "Yes" : "No"}
            </span>
            <Popover
              anchorRef={qualsBtnRef}
              open={openQuals}
              onClose={() => setOpenQuals(false)}
            >
              <div className="popover-body">
                <div className="font-semibold mb-1">Driver Qualifications:</div>
                <div className="text-sm">
                  {driverQualTypes.length ? (
                    <code>[{driverQualTypes.join(", ")}]</code>
                  ) : (
                    <em>None</em>
                  )}
                </div>
              </div>
            </Popover>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t">
        <div className="mb-2">
          <strong>Requester:</strong>{" "}
          {requestor
            ? `${requestor.first_name} ${requestor.last_name}`
            : row.requestor_id || "—"}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => {
              handlePost(true);
            }}
            className="btn btn-primary"
            value={true}
          >
            Approve
          </button>
          <button
            onClick={() => {
              handlePost(false);
            }}
            className="btn btn-danger"
            value={false}
          >
            Deny
          </button>
        </div>
        <div className="comments mt-2">
          <label htmlFor="comments">Add comments with approve/deny:</label>
          <input
            className="border rounded p-4 bg-white shadow mb-4 w-full"
            type="text"
            id="comments"
            name="user_name"
            placeholder="Enter comments here"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
