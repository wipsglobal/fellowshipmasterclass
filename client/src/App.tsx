import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ApplicationFormNew from "./pages/ApplicationFormNew";
import ApplicationDetail from "./pages/ApplicationDetail";
import AdminPanel from "./pages/AdminPanelNew";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import PaymentCallback from "./pages/PaymentCallback";
import AdminLogin from "./pages/AdminLogin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signup" component={SignUp} />
      <Route path="/login" component={Login} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/payment/callback">
        <ProtectedRoute>
          <PaymentCallback />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/apply">
        <ProtectedRoute>
          <ApplicationFormNew />
        </ProtectedRoute>
      </Route>
      <Route path="/application/:id">
        <ProtectedRoute>
          <ApplicationDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute adminOnly>
          <AdminPanel />
        </ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
