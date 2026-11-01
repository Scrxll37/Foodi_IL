import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { HomePage } from "./pages/HomePage";
import { RestaurantsPage } from "./pages/RestaurantsPage";
import { RestaurantDetailPage } from "./pages/RestaurantDetailPage";
import { MyAddressPage } from "./pages/MyAddressPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ConflictModal } from "./components/ConflictModal";

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useApp();
  const location = useLocation();

  if (!user.isLoggedIn) {
    const redirectTarget = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <ConflictModal />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/restaurants"
            element={
              <ProtectedRoute>
                <RestaurantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurants/:slug"
            element={
              <ProtectedRoute>
                <RestaurantDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/myaddress"
            element={
              <ProtectedRoute>
                <MyAddressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
