import LostPage from "../../website/components/LostPage";

export default function Unauthorized() {
  return (
    <LostPage title="You don't have access to this page"
      text="Your account can't open this page. If you think you need it, ask the garage admin."
      action={{ to: "/admin", label: "Back to the staff area" }} />
  );
}
