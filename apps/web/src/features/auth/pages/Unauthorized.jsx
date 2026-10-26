import LostPage from "../../website/components/LostPage";

export default function Unauthorized() {
  return (
    <LostPage code="403" eyebrow="No access" title={<>You can't open<br /><em>this page.</em></>}
      text="Your account can't open this page. If you think you need it, ask the garage admin."
      action={{ to: "/admin", label: "Back to the staff area" }} />
  );
}
