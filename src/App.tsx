import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Form from "./pages/Form";
import AdminList from "./pages/AdminList";
import AdminDetail from "./pages/AdminDetail";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import RequestDetail from "./pages/RequestDetail";
import MySubmissions from "./pages/MySubmissions";
import SSRDirectory from "./pages/SSRDirectory";
import SSRDetail from "./pages/SSRDetail";
import AgentDashboard from "./pages/AgentDashboard";
import UserApproval from "./pages/UserApproval";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Public form - no auth required */}
            <Route path="/form" element={<Form />} />
            <Route
              path="/my-submissions"
              element={
                <ProtectedRoute>
                  <MySubmissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/detail/:id"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute superAdminOnly>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request/:id"
              element={
                <ProtectedRoute>
                  <RequestDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-approval"
              element={
                <ProtectedRoute adminOnly>
                  <UserApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ssr-directory"
              element={
                <ProtectedRoute>
                  <SSRDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ssr/:id"
              element={
                <ProtectedRoute>
                  <SSRDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent-dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
