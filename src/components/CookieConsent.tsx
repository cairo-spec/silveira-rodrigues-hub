import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cookie, Settings, X, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  consentDate: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  functional: false,
  consentDate: "",
};

const STORAGE_KEY = "cookie_consent_preferences";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if user has already given consent
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences(parsed);
        setIsVisible(false);
      } catch {
        setIsVisible(true);
      }
    } else {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    const toSave = { ...prefs, consentDate: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setPreferences(toSave);
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      consentDate: "",
    });
  };

  const handleAcceptNecessary = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      consentDate: "",
    });
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === "necessary") return; // Can't disable necessary cookies
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={() => setShowDetails(false)}
      />
      
      {/* Banner */}
      <Card className="relative w-full max-w-2xl shadow-2xl border-border/50 pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Política de Cookies</CardTitle>
                <CardDescription className="text-sm">
                  Utilizamos cookies para melhorar sua experiência
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este site utiliza cookies para garantir o funcionamento adequado, analisar o tráfego e 
            personalizar sua experiência. Você pode gerenciar suas preferências ou aceitar todos 
            os cookies. Saiba mais em nossa{" "}
            <a 
              href="/politica-dados" 
              className="text-primary underline hover:text-primary/80"
              target="_blank"
            >
              Política de Privacidade
            </a>.
          </p>

          {/* Expandable Details */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gerenciar preferências
              </div>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                showDetails ? "max-h-96" : "max-h-0"
              )}
            >
              <div className="p-4 pt-0 space-y-4 border-t">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Cookies Necessários</Label>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Obrigatório
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Essenciais para o funcionamento do site. Não podem ser desativados.
                    </p>
                  </div>
                  <Switch checked disabled className="opacity-50" />
                </div>

                {/* Functional Cookies */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Cookies Funcionais</Label>
                    <p className="text-xs text-muted-foreground">
                      Permitem funcionalidades como preferências e personalização.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.functional}
                    onCheckedChange={(checked) => handlePreferenceChange("functional", checked)}
                  />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Cookies de Análise</Label>
                    <p className="text-xs text-muted-foreground">
                      Ajudam a entender como você usa o site para melhorar a experiência.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => handlePreferenceChange("analytics", checked)}
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Cookies de Marketing</Label>
                    <p className="text-xs text-muted-foreground">
                      Usados para exibir anúncios relevantes e medir campanhas.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => handlePreferenceChange("marketing", checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleAcceptNecessary}
              className="flex-1"
            >
              Aceitar Necessários
            </Button>
            {showDetails && (
              <Button
                variant="secondary"
                onClick={handleSavePreferences}
                className="flex-1"
              >
                Salvar Preferências
              </Button>
            )}
            <Button
              onClick={handleAcceptAll}
              className="flex-1"
            >
              <Shield className="h-4 w-4 mr-2" />
              Aceitar Todos
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to access cookie preferences
export const useCookiePreferences = (): CookiePreferences | null => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch {
        setPreferences(null);
      }
    }
  }, []);

  return preferences;
};

// Function to reset consent (useful for settings page)
export const resetCookieConsent = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};

export default CookieConsent;