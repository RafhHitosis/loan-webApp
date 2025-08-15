import { useAuth } from "./../../contexts/AuthContext";
import LoadingScreen from "../common/LoadingScreen";
import LoanTrackerApp from "../LoanTrackerApp";

const AppContent = () => {
  const { loading } = useAuth();
  return loading ? <LoadingScreen /> : <LoanTrackerApp />;
};

export default AppContent;
