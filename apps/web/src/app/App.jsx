import { Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import PrivateAuthRoute from "../features/auth/PrivateAuthRoute";
import { ROLES, STAFF, OFFICE } from "../shared/constants/roles";

import Home from "../features/website/pages/Home";
import About from "../features/website/pages/About";
import Services from "../features/website/pages/Services";
import Contact from "../features/website/pages/Contact";
import Login from "../features/auth/pages/Login";
import Unauthorized from "../features/auth/pages/Unauthorized";
import NotFound from "../features/website/pages/NotFound";

import Dashboard from "../features/dashboard/pages/Dashboard";
import EmployeeList from "../features/employees/pages/EmployeeList";
import EmployeeForm from "../features/employees/pages/EmployeeForm";
import Settings from "../features/settings/pages/Settings";
import Profile from "../features/profile/pages/Profile";
import CustomerList from "../features/customers/pages/CustomerList";
import CustomerForm from "../features/customers/pages/CustomerForm";
import CustomerProfile from "../features/customers/pages/CustomerProfile";
import VehiclePage from "../features/customers/pages/VehiclePage";
import ServiceList from "../features/services/pages/ServiceList";
import OrderList from "../features/orders/pages/OrderList";
import NewOrder from "../features/orders/pages/NewOrder";
import OrderDetail from "../features/orders/pages/OrderDetail";
import Estimate from "../features/orders/pages/Estimate";
import MyJobs from "../features/jobs/pages/MyJobs";
import Invoice from "../features/invoices/pages/Invoice";
import OrderStatus from "../features/tracking/pages/OrderStatus";

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
      </Route>
      <Route path="/order-status/:hash" element={<OrderStatus />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />

      <Route path="/admin" element={<PrivateAuthRoute roles={STAFF}><AdminLayout /></PrivateAuthRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="my-jobs" element={<PrivateAuthRoute roles={[T]}><MyJobs /></PrivateAuthRoute>} />
        <Route path="orders" element={<OrderList />} />
        <Route path="order/:id" element={<OrderDetail />} />
        <Route path="order/:id/invoice" element={<PrivateAuthRoute roles={OFFICE}><Invoice /></PrivateAuthRoute>} />
        <Route path="order/:id/estimate" element={<PrivateAuthRoute roles={OFFICE}><Estimate /></PrivateAuthRoute>} />
        <Route path="order/new" element={<PrivateAuthRoute roles={OFFICE}><NewOrder /></PrivateAuthRoute>} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customer/new" element={<PrivateAuthRoute roles={OFFICE}><CustomerForm /></PrivateAuthRoute>} />
        <Route path="customer/:id/edit" element={<PrivateAuthRoute roles={OFFICE}><CustomerForm /></PrivateAuthRoute>} />
        <Route path="customer/:id" element={<CustomerProfile />} />
        <Route path="vehicle/:id" element={<VehiclePage />} />
        <Route path="services" element={<PrivateAuthRoute roles={[A]}><ServiceList /></PrivateAuthRoute>} />
        <Route path="employees" element={<PrivateAuthRoute roles={[A]}><EmployeeList /></PrivateAuthRoute>} />
        <Route path="employee/new" element={<PrivateAuthRoute roles={[A]}><EmployeeForm /></PrivateAuthRoute>} />
        <Route path="employee/:id/edit" element={<PrivateAuthRoute roles={[A]}><EmployeeForm /></PrivateAuthRoute>} />
        <Route path="settings" element={<PrivateAuthRoute roles={[A]}><Settings /></PrivateAuthRoute>} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound inAdmin />} />
      </Route>
    </Routes>
  );
}
