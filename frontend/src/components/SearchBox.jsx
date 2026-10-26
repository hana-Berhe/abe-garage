import { useEffect, useState } from "react";

// Waits until typing stops before searching.
export default function SearchBox({ value, onSearch, placeholder = "Search" }) {
  const [text, setText] = useState(value || "");
  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== (value || "")) onSearch(text);
    }, 300);
    return () => clearTimeout(t);
  }, [text, value, onSearch]);
  return (
    <input
      type="search"
      className="form-control search-box"
      placeholder={placeholder}
      aria-label={placeholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  );
}
