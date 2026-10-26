import { Route, Routes } from "react-router-dom";
import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/AdminLayout";
import PrivateAuthRoute from "./components/PrivateAuthRoute";
import { ROLES, STAFF, OFFICE } from "./services/roles";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Unauthorized from "./pages/public/Unauthorized";
import NotFound from "./pages/public/NotFound";

import Dashboard from "./pages/admin/dashboard/Dashboard";
import ComingSoon from "./pages/admin/ComingSoon";
import EmployeeList from "./pages/admin/employees/EmployeeList";
import EmployeeForm from "./pages/admin/employees/EmployeeForm";
import Settings from "./pages/admin/settings/Settings";
import Profile from "./pages/admin/profile/Profile";
import CustomerList from "./pages/admin/customers/CustomerList";
import CustomerForm from "./pages/admin/customers/CustomerForm";
import CustomerProfile from "./pages/admin/customers/CustomerProfile";
import VehiclePage from "./pages/admin/customers/VehiclePage";

const { TECHNICIAN: T, ADMIN: A } = ROLES;

// Each module adds only its own routes here.
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin" element={<PrivateAuthRoute roles={STAFF}><AdminLayout /></PrivateAuthRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="my-jobs" element={<PrivateAuthRoute roles={[T]}><ComingSoon title="My jobs" owner="Member 3" /></PrivateAuthRoute>} />
        <Route path="orders" element={<ComingSoon title="Orders" owner="Member 3" />} />
        <Route path="order/new" element={<PrivateAuthRoute roles={OFFICE}><ComingSoon title="New order" owner="Member 3" /></PrivateAuthRoute>} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customer/new" element={<PrivateAuthRoute roles={OFFICE}><CustomerForm /></PrivateAuthRoute>} />
        <Route path="customer/:id/edit" element={<PrivateAuthRoute roles={OFFICE}><CustomerForm /></PrivateAuthRoute>} />
        <Route path="customer/:id" element={<CustomerProfile />} />
        <Route path="vehicle/:id" element={<VehiclePage />} />
        <Route path="services" element={<PrivateAuthRoute roles={[A]}><ComingSoon title="Services" owner="Member 3" /></PrivateAuthRoute>} />
        <Route path="employees" element={<PrivateAuthRoute roles={[A]}><EmployeeList /></PrivateAuthRoute>} />
        <Route path="employee/new" element={<PrivateAuthRoute roles={[A]}><EmployeeForm /></PrivateAuthRoute>} />
        <Route path="employee/:id/edit" element={<PrivateAuthRoute roles={[A]}><EmployeeForm /></PrivateAuthRoute>} />
        <Route path="settings" element={<PrivateAuthRoute roles={[A]}><Settings /></PrivateAuthRoute>} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>

    </Routes>
  );
}
