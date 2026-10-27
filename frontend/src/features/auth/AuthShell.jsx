import Header from "../../layouts/Header";
import Footer from "../../layouts/Footer";

// The login, forgot-password and reset-password pages: the normal site header and footer around a plain form.
export default function AuthShell({ children }) {
  return (
    <div className="ag">
      <Header />
      <main className="auth">
        <div className="wrap">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
