import Field from "../../../shared/components/Field";

export const EMPTY_VEHICLE = { year: "", make: "", model: "", type: "", mileage: "", plate: "", vin: "", color: "" };

// The car inputs, shared by the new-customer form, the add-car dialog and the car page.
// prefix matches the server's field names, such as "vehicle.plate".
export default function VehicleFields({ value, onChange, fieldError, prefix = "" }) {
  const props = (name, label, extra = {}) => ({
    label,
    name: prefix + name,
    value: value[name] ?? "",
    onChange: (e) => onChange({ ...value, [name]: e.target.value }),
    error: fieldError(prefix + name),
    ...extra,
  });
  return (
    <div className="row">
      <div className="col-sm-4"><Field {...props("year", "Year", { type: "number", min: 1900 })} /></div>
      <div className="col-sm-4"><Field {...props("make", "Make")} /></div>
      <div className="col-sm-4"><Field {...props("model", "Model")} /></div>
      <div className="col-sm-4"><Field {...props("plate", "Plate number")} /></div>
      <div className="col-sm-4"><Field {...props("type", "Type (sedan, SUV…)")} /></div>
      <div className="col-sm-4"><Field {...props("color", "Color")} /></div>
      <div className="col-sm-6"><Field {...props("mileage", "Mileage (km)", { type: "number", min: 0 })} /></div>
      <div className="col-sm-6"><Field {...props("vin", "VIN (optional, up to 32 characters)")} /></div>
    </div>
  );
}
