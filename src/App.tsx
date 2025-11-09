import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import StudentDashboard from "./pages/StudentDashboard";
import WardenDashboard from "./pages/WardenDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
          <Routes>
            <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
            <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
            <Route 
              path="/dashboard" 
              element={
                <ErrorBoundary>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ErrorBoundary>
                  <ProtectedRoute requiredRole="admin">
                    <AdminPanel />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route 
              path="/student" 
              element={
                <ErrorBoundary>
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route 
              path="/warden" 
              element={
                <ErrorBoundary>
                  <ProtectedRoute requiredRole="warden">
                    <WardenDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route path="/payment-success" element={<ErrorBoundary><PaymentSuccess /></ErrorBoundary>} />
            <Route path="/payment-cancel" element={<ErrorBoundary><PaymentCancel /></ErrorBoundary>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
