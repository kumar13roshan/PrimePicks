import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./components/WelcomePage";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard"; // Import Dashboard
import Purchase from "./components/Purchase";
import Sale from "./components/Sale";
import Transaction from "./components/Transaction2";
import Stock from "./components/Stock";
import ProtectedRoute from "./components/ProtectedRoute";
import Suppliers from "./components/Suppliers";
import Customers from "./components/Customers";
import AdminDetails from "./components/AdminDetails";
import SiteLayout from "./components/SiteLayout";


const ProtectedPage = ({ children }) => (
  <ProtectedRoute>
    <SiteLayout>{children}</SiteLayout>
  </ProtectedRoute>
);

const App = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedPage>
              <Dashboard />
            </ProtectedPage>
          )}
        /> {/* Add Dashboard Route */}
        <Route
          path="/purchase"
          element={(
            <ProtectedPage>
              <Purchase />
            </ProtectedPage>
          )}
        />
        <Route
          path="/sale"
          element={(
            <ProtectedPage>
              <Sale />
            </ProtectedPage>
          )}
        />
        <Route
          path="/transaction"
          element={(
            <ProtectedPage>
              <Transaction />
            </ProtectedPage>
          )}
        />
        <Route
          path="/stock"
          element={(
            <ProtectedPage>
              <Stock />
            </ProtectedPage>
          )}
        />
        <Route
          path="/suppliers"
          element={(
            <ProtectedPage>
              <Suppliers />
            </ProtectedPage>
          )}
        />
        <Route
          path="/customers"
          element={(
            <ProtectedPage>
              <Customers />
            </ProtectedPage>
          )}
        />
        <Route
          path="/admin-details"
          element={(
            <ProtectedPage>
              <AdminDetails />
            </ProtectedPage>
          )}
        />
      </Routes>
    </Router>
  );
};

export default App;
