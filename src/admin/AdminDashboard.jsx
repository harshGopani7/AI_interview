import { Routes, Route } from "react-router-dom";
import AdminDashboardLayout from "./AdminDashboardLayout";
import AdminOverview from "./pages/AdminOverview";
import AdminOrganizations from "./pages/AdminOrganizations";
import AdminCandidates from "./pages/AdminCandidates";
import AdminInterviews from "./pages/AdminInterviews";
import AdminSettings from "./pages/AdminSettings";
import PricingManager from "./pages/AdminPricing";
import PromptsManager from "./pages/AdminPrompts";
import AdminCvAnalysis from "./pages/AdminCvAnalysis";
import AdminSubscriptions from "./pages/AdminSubscriptions";

export default function AdminDashboard() {
  return (
    <AdminDashboardLayout>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="organizations" element={<AdminOrganizations />} />
        <Route path="candidates" element={<AdminCandidates />} />
        <Route path="interviews" element={<AdminInterviews />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="cv-analysis" element={<AdminCvAnalysis />} />
        <Route path="pricing" element={<PricingManager />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="prompts" element={<PromptsManager />} />
      </Routes>
    </AdminDashboardLayout>
  );
}
