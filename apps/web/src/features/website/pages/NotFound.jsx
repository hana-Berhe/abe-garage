import { Link } from "react-router-dom";
import LostPage from "../components/LostPage";

const TEXT = "The page you are looking for is not here. If you followed a link to your car's status, check the email we sent or call the desk.";

// `inAdmin` keeps the staff menu around the message instead of the full dark page.
export default function NotFound({ inAdmin = false }) {
  if (inAdmin) {
    return (
      <div className="ag-card">
        <h1 className="page-title">Page not found</h1>
        <p>This page does not exist.</p>
        <Link to="/admin" className="btn btn-brand">Back to the dashboard</Link>
      </div>
    );
  }
  return <LostPage code="404" title="This page took a wrong turn" text={TEXT} />;
}
