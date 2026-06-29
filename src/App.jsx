import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Layout from "./layout/Layout";

import Home from "./pages/Home";
import FeaturesPage from "./pages/Features";
import Setup from "./components/dashboard/pages/Practice";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import CandidateInterview from "./pages/CandidateInterview";
import CandidateLogin from "./pages/CandidateLogin";
import ScheduledInterviews from "./components/dashboard/pages/ScheduledInterviews";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Overview from "./components/dashboard/pages/Overview";
import Interviews from "./components/dashboard/pages/Interviews";
import Reports from "./components/dashboard/pages/Reports";
import Profile from "./components/dashboard/pages/Profile";
import Practice from "./components/dashboard/pages/Practice";

import OrgDashboardLayout from "./components/organization-dashboard/OrgDashboardLayout";
import OrgOverview from "./components/organization-dashboard/pages/OrgOverview";
import ScheduleInterview from "./components/organization-dashboard/pages/ScheduleInterview";
import OrgScheduler from "./components/organization-dashboard/pages/OrgScheduler";
import OrgInterviews from "./components/organization-dashboard/pages/OrgInterviews";
import OrgCandidates from "./components/organization-dashboard/pages/OrgCandidates";
import OrgSettings from "./components/organization-dashboard/pages/OrgSettings";
import InterviewResults from "./components/organization-dashboard/pages/InterviewResults";
import AudioMonitor from "./components/dashboard/pages/AudioMonitor";
import Pricing from "./components/pricing/Pricing";
import PricingManager from "./admin/pages/AdminPricing";

import AdminLogin from "./admin/AdminLogin";
import AdminSignup from "./admin/AdminSignup";
import AdminDashboard from "./admin/AdminDashboard";
import ContactUs from "./pages/ContactUs";
import OrgCvAnalyzer from "./components/organization-dashboard/pages/OrgCvAnalyzer";
import OrgCvHistory from "./components/organization-dashboard/pages/OrgCvHistory";
import OrgJobMaster from "./components/organization-dashboard/pages/OrgJobMaster";
import ManageSubscription from "./components/organization-dashboard/pages/ManageSubscription";
import UpgradeSubscription from "./components/organization-dashboard/pages/UpgradeSubscription";
import RazorpayUpgradeSubscription from "./components/organization-dashboard/pages/RazorpayUpgradeSubscription";
import SubscriptionBilling from "./components/organization-dashboard/pages/SubscriptionBilling";
import RazorpaySubscriptionBilling from "./components/organization-dashboard/pages/RazorpaySubscriptionBilling";
import Subscribe from "./pages/Subscribe";
import PaymentSuccess from "./pages/PaymentSuccess";

function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes with Layout (Header/Footer) */}
        <Route element={<LayoutWrapper />}>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/candidate-login" element={<CandidateLogin />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pm" element={<PricingManager />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Route>

        <Route path="/interview" element={<ProtectedRoute><CandidateInterview /></ProtectedRoute>} />

        {/* Candidate Dashboard Routes - No Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Overview />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/interviews" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Interviews />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/audio-testing" element={
          <ProtectedRoute>
            <DashboardLayout>
              <AudioMonitor />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/reports" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/profile" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/practice" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Practice />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/scheduled-interviews" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ScheduledInterviews />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Organization Dashboard Routes - No Layout */}
        <Route path="/organization/dashboard" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <OrgOverview />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/schedule-interview" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <ScheduleInterview />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/smart-scheduler" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <OrgScheduler />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/cv-analyser" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <OrgCvAnalyzer />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/cv-analyser/history" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <OrgCvHistory />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/job-master" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <OrgJobMaster />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/interviews" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <OrgInterviews />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/candidates" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <OrgCandidates />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/settings" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <OrgSettings />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/subscription" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <ManageSubscription />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/upgrade-subscription" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <UpgradeSubscription />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/upgrade-subscription/razorpay" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <RazorpayUpgradeSubscription />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/billing" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <SubscriptionBilling />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/billing/razorpay" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <RazorpaySubscriptionBilling />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/organization/dashboard/interview-results/:interviewId" element={
          <ProtectedRoute>
            <OrgDashboardLayout>
              <InterviewResults />
            </OrgDashboardLayout>
          </ProtectedRoute>
        } />

        {/* Admin Dashboard Routes - No Layout */}
        <Route path="/admin/dashboard/*" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
