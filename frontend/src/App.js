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
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        /> {/* Add Dashboard Route */}
        <Route
          path="/purchase"
          element={(
            <ProtectedRoute>
              <Purchase />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/sale"
          element={(
            <ProtectedRoute>
              <Sale />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/transaction"
          element={(
            <ProtectedRoute>
              <Transaction />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/stock"
          element={(
            <ProtectedRoute>
              <Stock />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/suppliers"
          element={(
            <ProtectedRoute>
              <Suppliers />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/customers"
          element={(
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin-details"
          element={(
            <ProtectedRoute>
              <AdminDetails />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </Router>
  );
};

export default App;
