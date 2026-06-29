import { Navigate } from "react-router-dom";
import { getToken } from "../services/token";

export default function ProtectedRoute({ children }) {
  const token = getToken();
  // console.log(token)
  return token ? children : <Navigate to="/login" />;
}
