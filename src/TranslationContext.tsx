import React, { createContext, useContext, useState, useEffect } from "react";

export type FIFALanguage = "en" | "es" | "fr" | "de" | "ar" | "pt";

export interface LanguageOption {
  code: FIFALanguage;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "العربية", flag: "🇦🇪" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
];

// Comprehensive translation dictionary for static UI text keys
const UI_DICTIONARY: Record<FIFALanguage, Record<string, string>> = {
  en: {}, // English is default, key will be used
  es: {
    "Stadium": "Estadio",
    "Capacity": "Capacidad",
    "Command Center": "Centro de Comando",
    "Active Live Match Ticker": "Marcador del Partido en Vivo",
    "Matchday": "Día del Partido",
    "Concourse Scanners Nominal": "Escáneres del Vestíbulo Nominales",
    "Live Tweaks": "Ajustes en Vivo",
    "Crowd Density": "Densidade de Multitud",
    "Crowd": "Multitud",
    "Parking %": "% de Estacionamiento",
    "Traffic": "Tránsito",
    "Weather": "Clima",
    "Active Bulletins": "Boletines Activos",
    "Parking Lots": "Estacionamientos",
    "Interactive Map & AI Helper": "Mapa Interactivo y Asistente de IA",
    "Predictive Analytics": "Análisis Predictivo",
    "AI Decision Support": "Soporte de Decisiones de IA",
    "Incidents & Staff Tasks": "Incidentes y Tareas del Personal",
    "Compliance & Testing": "Cumplimiento y Pruebas",
    "Super-Admin-Global-KPIs": "KPIs Globales del Super-Administrador",
    "Cross-Stadium Global Orchestration Console": "Consola de Orquestación Global Multi-Estadio",
    "Total Venues": "Sedes Totales",
    "Total Combined Capacity": "Capacidad Total Combinada",
    "Total Active Safety Incidents": "Incidentes Activos de Seguridad",
    "Global Server Health": "Salud Global del Servidor",
    "All Venues Synced": "Todas las Sedes Sincronizadas",
    "seats": "asientos",
    "alerts": "alertas",
    "nominal": "nominal",
    "FIFA World Cup Digital Venue Platform": "Plataforma Digital de Sedes de la Copa Mundial de la FIFA",
    "Authorized Operator Console": "Consola de Operador Autorizada",
    "Secure Session": "Sesión Segura",
    "All rights reserved": "Todos los derechos reservados",
    "Which gate has the shortest queue?": "¿Qué puerta tiene la cola más corta?",
    "Show me where the medical center is.": "Muéstrame dónde está el centro médico.",
    "Do you have vegetarian food options?": "¿Tienen opciones de comida vegetariana?",
    "How crowded is the stadium right now?": "¿Qué tan lleno está el estadio en este momento?",
    "What announcements are active?": "¿Qué anuncios están activos?",
    "LIVE NOW": "EN VIVO AHORA",
    "GIS Map Visualizer": "Visualizador de Mapa GIS",
    "Crowd Control": "Control de Multitudes",
    "Concession Stands": "Puestos de Comida",
    "Restrooms": "Baños",
    "Entry Gates": "Puertas de Entrada",
    "Medical Clinics": "Clínicas Médicas",
    "Select Facility to Command": "Seleccionar Instalación para Comandar",
    "Reporting Incident Dispatcher": "Despachador de Reportes de Incidentes",
    "Report Safety or Facility Hazard": "Reportar Peligro de Seguridad o Instalación",
    "Report Incident": "Reportar Incidente",
    "Staff Queue Optimizer": "Optimizador de Colas del Personal",
    "Chat with StadiumGPT Helper": "Chatear con Asistente StadiumGPT",
    "Ask anything about gates, concession wait times, restrooms, and security rules": "Pregunta lo que quieras sobre puertas, tiempos de comida, baños y seguridad",
    "Type stadium question...": "Escribe una pregunta sobre el estadio...",
    "Send": "Enviar",
    "Clear Feeds": "Limpiar Feeds",
    "OPERATIONAL FEED": "FEED OPERATIVO",
    "Live Tweaks:": "Ajustes en vivo:",
    "Located in": "Ubicado en",
    "FIFA World Cup": "Copa Mundial de la FIFA"
  },
  fr: {
    "Stadium": "Stade",
    "Capacity": "Capacité",
    "Command Center": "Centre de Commandement",
    "Active Live Match Ticker": "Téléscripteur de Match en Direct",
    "Matchday": "Jour de Match",
    "Concourse Scanners Nominal": "Scanners de Hall Nominaux",
    "Live Tweaks": "Ajustements en Direct",
    "Crowd Density": "Densité de Foule",
    "Crowd": "Foule",
    "Parking %": "% de Parking",
    "Traffic": "Circulation",
    "Weather": "Météo",
    "Active Bulletins": "Bulletins Actifs",
    "Parking Lots": "Parkings",
    "Interactive Map & AI Helper": "Carte Interactive et Assistant IA",
    "Predictive Analytics": "Analyses Prédictives",
    "AI Decision Support": "Aide à la Décision IA",
    "Incidents & Staff Tasks": "Incidents et Tâches du Personnel",
    "Compliance & Testing": "Conformité et Tests",
    "Super-Admin-Global-KPIs": "Indicateurs Globaux de Super-Admin",
    "Cross-Stadium Global Orchestration Console": "Console d'Orquestration Globale Multi-Stades",
    "Total Venues": "Total des Sites",
    "Total Combined Capacity": "Capacité Totale Combinée",
    "Total Active Safety Incidents": "Incidents de Sécurité Actifs",
    "Global Server Health": "Santé Globale du Serveur",
    "All Venues Synced": "Tous les Sites Synchronisés",
    "seats": "sièges",
    "alerts": "alertes",
    "nominal": "nominal",
    "FIFA World Cup Digital Venue Platform": "Plateforme Numérique des Sites de la Coupe du Monde de la FIFA",
    "Authorized Operator Console": "Console d'Opérateur Autorisée",
    "Secure Session": "Session Sécurisée",
    "All rights reserved": "Tous droits réservés",
    "Which gate has the shortest queue?": "Quelle porte a la file d'attente la plus courte ?",
    "Show me where the medical center is.": "Montrez-moi où se trouve le centre médical.",
    "Do you have vegetarian food options?": "Avez-vous des options de nourriture végétarienne ?",
    "How crowded is the stadium right now?": "Quel est le taux d'occupation du stade en ce moment ?",
    "What announcements are active?": "Quels messages d'alerte sont actifs ?",
    "LIVE NOW": "EN DIRECT",
    "GIS Map Visualizer": "Visualiseur de Carte SIG",
    "Crowd Control": "Contrôle des Foules",
    "Concession Stands": "Points de Vente",
    "Restrooms": "Toilettes",
    "Entry Gates": "Portes d'Entrée",
    "Medical Clinics": "Cliniques Médicales",
    "Select Facility to Command": "Sélectionner l'Installation à Commander",
    "Reporting Incident Dispatcher": "Répartiteur de Rapports d'Incidents",
    "Report Safety or Facility Hazard": "Signaler un Danger ou Incident",
    "Report Incident": "Signaler un Incident",
    "Staff Queue Optimizer": "Optimiseur de File d'Attente du Personnel",
    "Chat with StadiumGPT Helper": "Discuter avec l'Assistant de Stade",
    "Ask anything about gates, concession wait times, restrooms, and security rules": "Posez vos questions sur les entrées, l'attente, les toilettes et la sécurité",
    "Type stadium question...": "Tapez votre question...",
    "Send": "Envoyer",
    "Clear Feeds": "Effacer les Feeds",
    "OPERATIONAL FEED": "FLUX OPÉRATIONNEL",
    "Live Tweaks:": "Modifications en direct:",
    "Located in": "Situé à",
    "FIFA World Cup": "Coupe du Monde de la FIFA"
  },
  de: {
    "Stadium": "Stadion",
    "Capacity": "Kapazität",
    "Command Center": "Kommandozentrale",
    "Active Live Match Ticker": "Live-Spiel-Ticker",
    "Matchday": "Spieltag",
    "Concourse Scanners Nominal": "Umlauf-Scanner nominal",
    "Live Tweaks": "Live-Anpassungen",
    "Crowd Density": "Menge-Dichte",
    "Crowd": "Menge",
    "Parking %": "Parkplatz %",
    "Traffic": "Verkehr",
    "Weather": "Wetter",
    "Active Bulletins": "Aktive Meldungen",
    "Parking Lots": "Parkplätze",
    "Interactive Map & AI Helper": "Interaktive Karte & KI-Helfer",
    "Predictive Analytics": "Prädiktive Analysen",
    "AI Decision Support": "KI-Entscheidungshilfe",
    "Incidents & Staff Tasks": "Vorfälle & Personalaufgaben",
    "Compliance & Testing": "Compliance & Tests",
    "Super-Admin-Global-KPIs": "Super-Admin Globale KPIs",
    "Cross-Stadium Global Orchestration Console": "Globale stadionübergreifende Orchestrierungskonsole",
    "Total Venues": "Gesamte Spielorte",
    "Total Combined Capacity": "Gesamte kombinierte Kapazität",
    "Total Active Safety Incidents": "Aktive Sicherheitsvorfälle",
    "Global Server Health": "Globale Servergesundheit",
    "All Venues Synced": "Alle Spielorte synchronisiert",
    "seats": "Sitzplätze",
    "alerts": "Alarme",
    "nominal": "nominal",
    "FIFA World Cup Digital Venue Platform": "Digitale FIFA WM-Spielort-Plattform",
    "Authorized Operator Console": "Autorisierte Bedienerkonsole",
    "Secure Session": "Sichere Sitzung",
    "All rights reserved": "Alle Rechte vorbehalten",
    "Which gate has the shortest queue?": "Welches Tor hat die kürzeste Schlange?",
    "Show me where the medical center is.": "Zeig mir, wo das medizinische Zentrum ist.",
    "Do you have vegetarian food options?": "Gibt es vegetarische Essensoptionen?",
    "How crowded is the stadium right now?": "Wie voll ist das Stadion gerade?",
    "What announcements are active?": "Welche Durchsagen sind aktiv?",
    "LIVE NOW": "LIVE JETZT",
    "GIS Map Visualizer": "GIS-Karten-Visualisierer",
    "Crowd Control": "Mengensteuerung",
    "Concession Stands": "Verkaufsstände",
    "Restrooms": "Toiletten",
    "Entry Gates": "Eingangstore",
    "Medical Clinics": "Medizinische Kliniken",
    "Select Facility to Command": "Anlage zur Steuerung auswählen",
    "Reporting Incident Dispatcher": "Incident Report Dispatcher",
    "Report Safety or Facility Hazard": "Sicherheits- oder Anlagenrisiko melden",
    "Report Incident": "Vorfall melden",
    "Staff Queue Optimizer": "Personal Schlangen-Optimierer",
    "Chat with StadiumGPT Helper": "Chat mit StadiumGPT-Helfer",
    "Ask anything about gates, concession wait times, restrooms, and security rules": "Fragen Sie alles zu Toren, Wartezeiten, Toiletten und Regeln",
    "Type stadium question...": "Stadion-Frage eingeben...",
    "Send": "Senden",
    "Clear Feeds": "Feeds leeren",
    "OPERATIONAL FEED": "BETRIEBLICHER FEED",
    "Live Tweaks:": "Live-Optimierungen:",
    "Located in": "Befindet sich in",
    "FIFA World Cup": "FIFA-Weltmeisterschaft"
  },
  ar: {
    "Stadium": "الملعب",
    "Capacity": "السعة",
    "Command Center": "مركز القيادة",
    "Active Live Match Ticker": "شريط المباراة المباشرة",
    "Matchday": "يوم المباراة",
    "Concourse Scanners Nominal": "أجهزة المسح الضوئي طبيعية",
    "Live Tweaks": "تعديلات مباشرة",
    "Crowd Density": "كثافة الجماهير",
    "Crowd": "الجمهور",
    "Parking %": "نسبة مواقف السيارات",
    "Traffic": "حركة المرور",
    "Weather": "الطقس",
    "Active Bulletins": "النشرات النشطة",
    "Parking Lots": "مواقف السيارات",
    "Interactive Map & AI Helper": "الخريطة التفاعلية ومساعد الذكاء الاصطناعي",
    "Predictive Analytics": "التحليلات التنبؤية",
    "AI Decision Support": "دعم القرار بالذكاء الاصطناعي",
    "Incidents & Staff Tasks": "الحوادث ومهام الموظفين",
    "Compliance & Testing": "الامتثال والاختبار",
    "Super-Admin-Global-KPIs": "مؤشرات الأداء العالمية للمسؤول الفائق",
    "Cross-Stadium Global Orchestration Console": "لوحة التحكم العالمية للتنسيق بين الملاعب",
    "Total Venues": "إجمالي الملاعب",
    "Total Combined Capacity": "السعة الإجمالية المشتركة",
    "Total Active Safety Incidents": "حوادث السلامة النشطة",
    "Global Server Health": "صحة الخادم العالمية",
    "All Venues Synced": "مزامنة جميع الملاعب",
    "seats": "مقاعد",
    "alerts": "تنبيهات",
    "nominal": "طبيعي",
    "FIFA World Cup Digital Venue Platform": "المنصة الرقمية لملاعب كأس العالم فيفا",
    "Authorized Operator Console": "لوحة تحكم المشغل المعتمد",
    "Secure Session": "جلسة آمنة",
    "All rights reserved": "جميع الحقوق محفوظة",
    "Which gate has the shortest queue?": "أي بوابة بها أقصر طابور؟",
    "Show me where the medical center is.": "أرني أين يقع المركز الطبي.",
    "Do you have vegetarian food options?": "هل لديكم خيارات طعام نباتي؟",
    "How crowded is the stadium right now?": "ما مدى ازدحam الاستاد الآن؟",
    "What announcements are active?": "ما هي الإعلانات النشطة؟",
    "LIVE NOW": "مباشر الآن",
    "GIS Map Visualizer": "مستعرض خرائط نظم المعلومات الجغرافية GIS",
    "Crowd Control": "التحكم في الحشود",
    "Concession Stands": "أكشاك البيع",
    "Restrooms": "دورات المياه",
    "Entry Gates": "بوابات الدخول",
    "Medical Clinics": "العيادات الطبية",
    "Select Facility to Command": "اختر المنشأة للتحكم بها",
    "Reporting Incident Dispatcher": "مراسل بلاغات الحوادث",
    "Report Safety or Facility Hazard": "أبلغ عن خطر أمني أو عيب منشآت",
    "Report Incident": "أبلغ عن حادث",
    "Staff Queue Optimizer": "محسن طوابير الموظفين",
    "Chat with StadiumGPT Helper": "تحدث مع مساعد StadiumGPT",
    "Ask anything about gates, concession wait times, restrooms, and security rules": "اسأل عن البوابات، أوقات الانتظar، دورات المياه، وقواعد الأمن",
    "Type stadium question...": "اكتب سؤالك عن الملعب...",
    "Send": "إرسال",
    "Clear Feeds": "مسح النشرات",
    "OPERATIONAL FEED": "النشرة التشغيلية",
    "Live Tweaks:": "تعديلات مباشرة:",
    "Located in": "يقع في",
    "FIFA World Cup": "كأس العالم فيفا"
  },
  pt: {
    "Stadium": "Estádio",
    "Capacity": "Capacidade",
    "Command Center": "Centro de Comando",
    "Active Live Match Ticker": "Placar do Jogo ao Vivo",
    "Matchday": "Dia do Jogo",
    "Concourse Scanners Nominal": "Scanners do Saguão Nominais",
    "Live Tweaks": "Ajustes ao Vivo",
    "Crowd Density": "Densidade da Multidão",
    "Crowd": "Multidão",
    "Parking %": "% de Estacionamento",
    "Traffic": "Trânsito",
    "Weather": "Clima",
    "Active Bulletins": "Boletins Ativos",
    "Parking Lots": "Estacionamentos",
    "Interactive Map & AI Helper": "Mapa Interativo e Assistente de IA",
    "Predictive Analytics": "Análises Preditivas",
    "AI Decision Support": "Suporte de Decisão de IA",
    "Incidents & Staff Tasks": "Incidentes e Tarefas da Equipe",
    "Compliance & Testing": "Conformidade e Testes",
    "Super-Admin-Global-KPIs": "KPIs Globais do Super-Administrador",
    "Cross-Stadium Global Orchestration Console": "Console de Orquestração Global Multiestádio",
    "Total Venues": "Total de Locais",
    "Total Combined Capacity": "Capacidade Combinada Total",
    "Total Active Safety Incidents": "Incidentes Ativos de Segurança",
    "Global Server Health": "Saúde Global do Servidor",
    "All Venues Synced": "Todos os Locais Sincronizados",
    "seats": "assentos",
    "alerts": "alertas",
    "nominal": "nominal",
    "FIFA World Cup Digital Venue Platform": "Plataforma Digital de Sedes da Copa do Mundo da FIFA",
    "Authorized Operator Console": "Console de Operador Autorizado",
    "Secure Session": "Sessão Segura",
    "All rights reserved": "Todos os direitos reservados",
    "Which gate has the shortest queue?": "Qual portão tem a menor fila?",
    "Show me where the medical center is.": "Mostre-me onde fica o centro médico.",
    "Do you have vegetarian food options?": "Você tem opções de comida vegetariana?",
    "How crowded is the stadium right now?": "Quão cheio está o estádio agora?",
    "What announcements are active?": "Quais comunicados estão ativos?",
    "LIVE NOW": "AO VIVO AGORA",
    "GIS Map Visualizer": "Visualizador de Mapa GIS",
    "Crowd Control": "Controle de Multidão",
    "Concession Stands": "Postos de Alimentação",
    "Restrooms": "Banheiros",
    "Entry Gates": "Portões de Entrada",
    "Medical Clinics": "Clínicas Médicas",
    "Select Facility to Command": "Selecionar Instalação para Comandar",
    "Reporting Incident Dispatcher": "Despachador de Relatórios de Incidentes",
    "Report Safety or Facility Hazard": "Relatar Perigo de Segurança ou Instalação",
    "Report Incident": "Relatar Incidente",
    "Staff Queue Optimizer": "Otimizador de Filas da Equipe",
    "Chat with StadiumGPT Helper": "Conversar com Assistente StadiumGPT",
    "Ask anything about gates, concession wait times, restrooms, and security rules": "Pergunte sobre portões, tempos de espera, banheiros e regras",
    "Type stadium question...": "Digite sua pergunta...",
    "Send": "Enviar",
    "Clear Feeds": "Limpar Feeds",
    "OPERATIONAL FEED": "FEED OPERACIONAL",
    "Live Tweaks:": "Ajustes ao vivo:",
    "Located in": "Localizado em",
    "FIFA World Cup": "Copa do Mundo da FIFA"
  },
};

interface TranslationContextType {
  language: FIFALanguage;
  setLanguage: (lang: FIFALanguage) => void;
  t: (text: string) => string;
  translateBatch: (texts: string[]) => Promise<string[]>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<FIFALanguage>(() => {
    const saved = localStorage.getItem("stadiumgpt_lang");
    return (saved as FIFALanguage) || "en";
  });

  const setLanguage = (lang: FIFALanguage) => {
    setLanguageState(lang);
    localStorage.setItem("stadiumgpt_lang", lang);
  };

  // Synchronous translation using dictionary
  const t = (text: string): string => {
    if (language === "en") return text;
    const langDict = UI_DICTIONARY[language];
    if (langDict && langDict[text]) {
      return langDict[text];
    }
    // Fallback if specific word boundary matches but case differs
    const trimmed = text.trim();
    if (langDict && langDict[trimmed]) {
      return langDict[trimmed];
    }
    return text;
  };

  // Asynchronous API translator using Gemini server routes
  const translateBatch = async (texts: string[]): Promise<string[]> => {
    if (language === "en") return texts;
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, targetLanguage: language }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.translatedTexts && Array.isArray(data.translatedTexts)) {
          return data.translatedTexts;
        }
      }
    } catch (err) {
      console.error("Failed to fetch dynamic translations:", err);
    }
    // Fallback to dictionary or original
    return texts.map(txt => t(txt));
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, translateBatch }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};
