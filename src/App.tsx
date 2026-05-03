import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Inscription from "./pages/Inscription.tsx";
import Connexion from "./pages/Connexion.tsx";
import MotDePasseOublie from "./pages/MotDePasseOublie.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Quizz from "./pages/Quizz.tsx";
import QuizzPlay from "./pages/QuizzPlay.tsx";
import QuizzRecap from "./pages/QuizzRecap.tsx";
import Classement from "./pages/Classement.tsx";
import Profil from "./pages/Profil.tsx";
import Annonces from "./pages/Annonces.tsx";
import Citations from "./pages/Citations.tsx";
import { AdminLayout } from "./components/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminQuizzes from "./pages/admin/AdminQuizzes.tsx";
import AdminQuizEditor from "./pages/admin/AdminQuizEditor.tsx";
import AdminStats from "./pages/admin/AdminStats.tsx";
import AdminGospel from "./pages/admin/AdminGospel.tsx";
import AdminQuotes from "./pages/admin/AdminQuotes.tsx";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements.tsx";
import AdminSchedules from "./pages/admin/AdminSchedules.tsx";
import AdminDailyChallenge from "./pages/admin/AdminDailyChallenge.tsx";
import AdminConnexion from "./pages/admin/AdminConnexion.tsx";
import AdminInscription from "./pages/admin/AdminInscription.tsx";
import AdminMoniteurs from "./pages/admin/AdminMoniteurs.tsx";
import AdminInvitationRedeem from "./pages/admin/AdminInvitationRedeem.tsx";
import AdminChildren from "./pages/admin/AdminChildren.tsx";
import AdminProfil from "./pages/admin/AdminProfil.tsx";
import { OfflineBanner } from "./components/OfflineBanner.tsx";

const queryClient = new QueryClient();

const ProtectedProfileRoute = () => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/connexion" replace />;
  }

  return <Profil />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/quizz" element={<Quizz />} />
            <Route path="/quizz/:id" element={<QuizzPlay />} />
            <Route path="/quizz/:id/recap" element={<QuizzRecap />} />
            <Route path="/classement" element={<Classement />} />
            <Route path="/profil" element={<ProtectedProfileRoute />} />
            <Route path="/annonces" element={<Annonces />} />
            <Route path="/citations" element={<Citations />} />
            <Route path="/admin/connexion" element={<AdminConnexion />} />
            <Route
              path="/admin/mot-de-passe-oublie"
              element={<MotDePasseOublie admin />}
            />
            <Route path="/admin/inscription" element={<AdminInscription />} />
            <Route path="/admin/invitation/:token" element={<AdminInvitationRedeem />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="quizz" element={<AdminQuizzes />} />
              <Route path="quizz/nouveau" element={<AdminQuizEditor />} />
              <Route path="quizz/:id" element={<AdminQuizEditor />} />
              <Route path="statistiques" element={<AdminStats />} />
              <Route path="evangile" element={<AdminGospel />} />
              <Route path="citations" element={<AdminQuotes />} />
              <Route path="annonces" element={<AdminAnnouncements />} />
              <Route path="horaires" element={<AdminSchedules />} />
              <Route path="defi" element={<AdminDailyChallenge />} />
              <Route path="enfants" element={<AdminChildren />} />
              <Route path="moniteurs" element={<AdminMoniteurs />} />
              <Route path="profil" element={<AdminProfil />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
