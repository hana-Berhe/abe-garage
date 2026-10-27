import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

// Opens each page at the top, or at the section named after # (for example /#reviews).
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const timer = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 50);
    return () => clearTimeout(timer);
  }, [pathname, hash]);
}

export default function PublicLayout() {
  useScrollOnNavigate();
  return (
    <div className="ag">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
