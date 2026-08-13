/* ============================================================
   NOIRA — Routen
   ============================================================ */

import ErrorBoundary from "@/components/ErrorBoundary";
import { Layout } from "@/components/layout/Layout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Advertise from "@/pages/Advertise";
import Checkout from "@/pages/Checkout";
import Clubs from "@/pages/Clubs";
import Compose from "@/pages/Compose";
import Home from "@/pages/Home";
import Legal from "@/pages/Legal";
import ListingDetail from "@/pages/ListingDetail";
import Listings from "@/pages/Listings";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Safety from "@/pages/Safety";
import Saved from "@/pages/Saved";
import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/inserate" component={Listings} />
      <Route path="/inserat/:slug" component={ListingDetail} />
      <Route path="/clubs" component={Clubs} />
      <Route path="/merkliste" component={Saved} />
      <Route path="/werben" component={Advertise} />
      <Route path="/inserat-erfassen" component={Compose} />
      <Route path="/kasse" component={Checkout} />
      <Route path="/login" component={Login} />
      <Route path="/registrieren" component={Login} />
      <Route path="/sicherheit" component={Safety} />
      <Route path="/agb" component={Legal} />
      <Route path="/datenschutz" component={Legal} />
      <Route path="/impressum" component={Legal} />
      <Route component={NotFound} />
    </Switch>
  );
}

/* Für Vorschau-Builds, die als einzelne Datei ohne Server ausgeliefert
   werden (Artifact, lokal geöffnete HTML): Ohne Server beantwortet
   niemand /inserate, darum laufen die Routen dort über den Hash.
   Die reguläre Auslieferung bleibt bei sauberen Pfaden. */
const HASH_ROUTING = import.meta.env.VITE_HASH_ROUTING === "1";

export default function App() {
  const routes = <Routes />;

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={200}>
        <Toaster position="top-center" />
        {HASH_ROUTING ? (
          <Router hook={useHashLocation}>
            <Layout>{routes}</Layout>
          </Router>
        ) : (
          <Layout>{routes}</Layout>
        )}
      </TooltipProvider>
    </ErrorBoundary>
  );
}
