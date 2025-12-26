import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Membros from "./pages/Membros";
import Obrigado from "./pages/Obrigado";
import Experimente from "./pages/Experimente";
import PoliticaDados from "./pages/PoliticaDados";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Analytics wrapper component (must be inside BrowserRouter)
const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  useAnalytics();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/membros" element={<Membros />} />
              <Route path="/obrigado" element={<Obrigado />} />
              <Route path="/experimente" element={<Experimente />} />
              <Route path="/politica-dados" element={<PoliticaDados />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </AnalyticsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
