import React from "react";
import { useAuth } from "./../../contexts/AuthContext";
import LoadingScreen from "../common/LoadingScreen";
import LoanTrackerApp from "../LoanTrackerApp";
import DisabledAccountMessage from "../indicators/DisabledAccountMessage";
import LoginForm from "../auth/LoginForm";

const AppContent = () => {
  const { user, loading, isAccountDisabled } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return <LoadingScreen />;
  }

  // If no user is logged in, show login form
  if (!user) {
    return <LoginForm />;
  }

  // If user is logged in but account is disabled, show disabled message
  if (user && isAccountDisabled) {
    return (
      <DisabledAccountMessage
        onBackToLogin={() => {
          // This will trigger sign out and show login form
          window.location.reload();
        }}
        userEmail={user.email}
      />
    );
  }

  // If user is logged in and account is active, show the app
  return <LoanTrackerApp />;
};

export default AppContent;
