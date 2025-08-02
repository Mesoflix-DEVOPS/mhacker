import React, { lazy, Suspense, useEffect, useState, useCallback } from "react";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import ChunkLoader from "@/components/loader/chunk-loader";
import DesktopWrapper from "@/components/shared_ui/desktop-wrapper";
import Dialog from "@/components/shared_ui/dialog";
import MobileWrapper from "@/components/shared_ui/mobile-wrapper";
import Tabs from "@/components/shared_ui/tabs/tabs";
import TradingViewModal from "@/components/trading-view-chart/trading-view-modal";
import { DBOT_TABS } from "@/constants/bot-contents";
import { api_base, updateWorkspaceName } from "@/external/bot-skeleton";
import { CONNECTION_STATUS } from "@/external/bot-skeleton/services/api/observables/connection-status-stream";
import { useApiBase } from "@/hooks/useApiBase";
import { useStore } from "@/hooks/useStore";
import { Localize, localize } from "@deriv-com/translations";
import { useDevice } from "@deriv-com/ui";
import RunPanel from "../../components/run-panel";
import ChartModal from "../chart/chart-modal";
import Dashboard from "../dashboard";
import RunStrategy from "../dashboard/run-strategy";

const Chart = lazy(() => import("../chart"));
const Tutorial = lazy(() => import("../tutorials"));
const Copytrading = lazy(() => import("../copytrading"));

/** NEW ICONS WITH OUTLINE STYLE **/
const FreeBotsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <circle cx="15.5" cy="8.5" r="1.5" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="10" y1="18" x2="14" y2="18" />
  </svg>
)

const BotSettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 3.417 1.415 2 2 0 0 1-.587 1.415l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const ChartsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const DCirclesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const AnalysisToolIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <path d="M21 21l-6-6m6 6l-6 6m6-16a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ToolsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a1 1 0 00-.29-1.61l-4.11-1.71a1 1 0 00-1.24.49l-1.13 2.4z" />
    <path d="M12.19 8.84l-7.9 7.9a1 1 0 00-.29.59l-.53 4.11a1 1 0 001.17 1.09l4.11-.53a1 1 0 00.59-.29l7.9-7.9a1 1 0 000-1.41l-4.24-4.24a1 1 0 00-1.41 0z" />
    <path d="M6.51 17.49l-1.6-1.6a1 1 0 010-1.42l1.6-1.6a1 1 0 011.41 0l1.6 1.6a1 1 0 010 1.41l-1.6 1.6a1 1 0 01-1.41 0z" />
  </svg>
)

const CopyTradingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
    <rect x="3" y="3" width="10" height="10" rx="2" />
    <rect x="11" y="11" width="10" height="10" rx="2" />
    <path d="M7 7h2M7 9h3M15 15h2M15 17h3M13 3v8M21 11h-8" />
  </svg>
)

const StrategyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const SignalsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)

const TutorialsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

// Social Media Icons
const YouTubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"
      fill="#FF0000"
    />
    <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="#fff" />
  </svg>
)

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="5" stroke="#E1306C" strokeWidth="2" fill="none" />
    <circle cx="18" cy="6" r="1" fill="#E1306C" />
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      fill="#25D366"
    />
  </svg>
)

const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
      fill="#000000"
    />
  </svg>
)

const TelegramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-12S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.69 1.03-.58.05-1-.39-1.56-.76-.86-.56-1.35-.91-2.19-1.46-.96-.63-.34-1.01.21-1.59.14-.14 2.65-2.43 2.7-2.64.01-.04.01-.19-.06-.27-.07-.08-.17-.05-.25-.03-.1.03-1.79 1.12-5.06 3.3-.48.33-.92.5-1.4.49-.46-.02-1.36-.26-2.03-.48-.82-.27-1.48-.41-1.42-.87.03-.24.33-.5.91-.72 4.91-2.07 7.31-3.08 8.26-3.45 3.8-1.51 4.59-1.77 5.11-1.77.12 0 .38.03.55.18.13.12.16.28.15.4-.04.4-.52 4.69-.75 6.37z"
      fill="#0088CC"
    />
  </svg>
)

const AppWrapper = observer(() => {
  const { connectionStatus } = useApiBase();
  const { dashboard, load_modal, run_panel, summary_card } = useStore();
  const { active_tab, is_chart_modal_visible, is_trading_view_modal_visible, setActiveTab } = dashboard;
  const { onEntered } = load_modal;
  const {
    is_dialog_open,
    dialog_options,
    onCancelButtonClick,
    onCloseDialog,
    onOkButtonClick,
    stopBot,
    is_drawer_open,
  } = run_panel;
  const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string };
  const { clear } = summary_card;
  const { isDesktop } = useDevice();
  const [bots, setBots] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const analysisUrl = "https://mesoflixldpnew.vercel.app/";
  const dcirclesUrl = "https://analysern.netlify.app/";
  const strategyUrl = "https://mesoflixstrategies.netlify.app/";
  const toolsUrl = "https://alltools-ten.vercel.app/";

  useEffect(() => {
    if (connectionStatus !== CONNECTION_STATUS.OPENED) {
      const is_bot_running = document.getElementById("db-animation__stop-button") !== null;
      if (is_bot_running) {
        clear();
        stopBot();
        api_base.setIsRunning(false);
      }
    }
  }, [clear, connectionStatus, stopBot]);

  useEffect(() => {
    const fetchBots = async () => {
      const botFiles = [
        "Osam_Digit_Switcher🤖🤖.xml",
        "Under-Destroyer💀.xml",
        "Over HitnRun.xml",
        "Osam.HnR.xml",
        "Over-Destroyer💀.xml",
        "Auto Bot by Osam💯.xml",
        "DEC_entry_Point.xml",
        "Under 8 pro bot💯.xml",
      ];
      const botPromises = botFiles.map(async (file) => {
        try {
          const response = await fetch(file);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
          }
          const text = await response.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, "application/xml");
          return {
            title: file.split("/").pop(),
            image: xml.getElementsByTagName("image")[0]?.textContent || "default_image_path",
            filePath: file,
            xmlContent: text,
          };
        } catch (error) {
          console.error(error);
          return null;
        }
      });
      const bots = (await Promise.all(botPromises)).filter(Boolean);
      setBots(bots);
    };
    fetchBots();
  }, []);

  const formatBotName = (name) => {
    return name.replace(/\.xml$/, '');
  };

  const handleTabChange = React.useCallback(
    (tab_index: number) => {
      setActiveTab(tab_index);
    },
    [setActiveTab],
  );

  const handleBotClick = useCallback(
    async (bot: { filePath: string; xmlContent: string }) => {
      setActiveTab(DBOT_TABS.BOT_BUILDER);
      try {
        if (typeof load_modal.loadFileFromContent === "function") {
          try {
            await load_modal.loadFileFromContent(bot.xmlContent);
          } catch (loadError) {
            console.error("Error in load_modal.loadFileFromContent:", loadError);
          }
        } else {
          console.error("loadFileFromContent is not defined on load_modal");
        }
        updateWorkspaceName(bot.xmlContent);
      } catch (error) {
        console.error("Error loading bot file:", error);
      }
    },
    [setActiveTab, load_modal, updateWorkspaceName],
  );

  const handleOpen = useCallback(async () => {
    await load_modal.loadFileFromRecent();
    setActiveTab(DBOT_TABS.BOT_BUILDER);
  }, [load_modal, setActiveTab]);

  const showRunPanel = [1, 2, 3, 4].includes(active_tab);

  return (
    <React.Fragment>
      <div className="main">
        <div className="main__container">
          <Tabs
            active_index={active_tab}
            className="main__tabs"
            onTabItemChange={onEntered}
            onTabItemClick={handleTabChange}
            top
          >
            {/* 1. Free Bots */}
            <div
              label={
                <>
                  <FreeBotsIcon />
                  <Localize i18n_default_text="Free Bots" />
                </>
              }
              id="id-free-bots"
            >
              <div className="free-bots">
                <div className="free-bots__social-icons">
                  <a href="https://youtube.com/@osamtradinghub-cl1fs?si=T7hBArbo4PeRLOXu" target="_blank" rel="noopener noreferrer">
                    <YouTubeIcon />
                  </a>
                  <a href="https://www.instagram.com/osamtradinghub.com1?igsh=Mmh2aW43a3dpamRq" target="_blank" rel="noopener noreferrer">
                    <InstagramIcon />
                  </a>
                  <a href="https://chat.whatsapp.com/E2cZOyZr75VExcbkprwuTe?mode=ac_t" target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon />
                  </a>
                  <a href="https://www.tiktok.com/@_its_osam?_t=ZM-8yUINW3W742&_r=1" target="_blank" rel="noopener noreferrer">
                    <TikTokIcon />
                  </a>
                  <a href="https://t.me/+dLoQvTnT_2wzOGY0" target="_blank" rel="noopener noreferrer">
                    <TelegramIcon />
                  </a>
                </div>

                <div className="free-bots__content-wrapper">
                  <div className="free-bots__content">
                    {bots.map((bot, index) => (
                      <div key={index} className="free-bots__bot-item">
                        <div className="free-bots__bot-item-content">
                          <div className="free-bots__bot-icon">
                            <FreeBotsIcon />
                          </div>
                          <div className="free-bots__bot-info">
                            <h3>{formatBotName(bot.title)}</h3>
                          </div>
                        </div>
                        <button 
                          className="free-bots__load-button"
                          onClick={() => handleBotClick(bot)}
                        >
                          Load Bot
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Bot Settings */}
            <div
              label={
                <>
                  <BotSettingsIcon />
                  <Localize i18n_default_text="Bot Settings" />
                </>
              }
              id="id-bot-settings"
            >
              <Dashboard handleTabChange={handleTabChange} />
              <button className="load-bot-button" onClick={handleOpen}>Load Bot</button>
            </div>

            {/* 3. Charts */}
            <div
              label={
                <>
                  <ChartsIcon />
                  <Localize i18n_default_text="Charts" />
                </>
              }
              id="id-charts"
            >
              <Suspense fallback={<ChunkLoader message={localize("Please wait, loading chart...")} />}>
                <Chart show_digits_stats={false} />
              </Suspense>
            </div>

            {/* 4. Dcircles */}
            <div
              label={
                <>
                  <DCirclesIcon />
                  <Localize i18n_default_text="Dcircles" />
                </>
              }
              id="id-dcircles"
            >
              <div className="iframe-container">
                <iframe
                  src={dcirclesUrl}
                  title="Dcircles"
                  className="iframe-content"
                />
              </div>
            </div>

            {/* 5. Analysis */}
            <div
              label={
                <>
                  <AnalysisToolIcon />
                  <Localize i18n_default_text="Analysis" />
                </>
              }
              id="id-analysis"
            >
              <div className="iframe-container">
                <iframe
                  src={analysisUrl}
                  title="Analysis"
                  className="iframe-content"
                />
              </div>
            </div>

            {/* 6. Tools */}
            <div
              label={
                <>
                  <ToolsIcon />
                  <Localize i18n_default_text="Tools" />
                </>
              }
              id="id-tools"
            >
              <div className="iframe-container">
                <iframe
                  src={toolsUrl}
                  title="Tools"
                  className="iframe-content"
                />
              </div>
            </div>

            {/* 7. Copytrading */}
            <div
              label={
                <>
                  <CopyTradingIcon />
                  <Localize i18n_default_text="Copytrading" />
                </>
              }
              id="id-copytrading"
            >
              <Suspense fallback={<ChunkLoader message={localize("Please wait, loading copytrading...")} />}>
                <Copytrading />
              </Suspense>
            </div>

            {/* 8. Strategies */}
            <div
              label={
                <>
                  <StrategyIcon />
                  <Localize i18n_default_text="Strategy" />
                </>
              }
              id="id-strategy"
            >
              <div className="iframe-container">
                <iframe
                  src={strategyUrl}
                  title="Strategy"
                  className="iframe-content"
                />
              </div>
            </div>

            {/* 9. Signals */}
            <div
              label={
                <>
                  <SignalsIcon />
                  <Localize i18n_default_text="Signals" />
                </>
              }
              id="id-signals"
            >
              <div className={classNames("dashboard__chart-wrapper", {
                "dashboard__chart-wrapper--expanded": is_drawer_open && isDesktop,
                "dashboard__chart-wrapper--modal": is_chart_modal_visible && isDesktop,
              })}>
                <iframe
                  src="signals"
                  className="iframe-content"
                />
              </div>
            </div>

            {/* 10. Tutorials */}
            <div
              label={
                <>
                  <TutorialsIcon />
                  <Localize i18n_default_text="Tutorials" />
                </>
              }
              id="id-tutorials"
            >
              <Suspense fallback={<ChunkLoader message={localize("Please wait, loading tutorials...")} />}>
                <Tutorial handleTabChange={handleTabChange} />
              </Suspense>
            </div>
          </Tabs>
        </div>
      </div>
      
      <button 
        className="disclaimer-button"
        onClick={() => setShowDisclaimer(true)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Disclaimer
      </button>

      {showDisclaimer && (
        <div className="disclaimer-modal">
          <div className="disclaimer-modal__content">
            <button
              className="disclaimer-modal__close-button"
              onClick={() => setShowDisclaimer(false)}
            >
              ×
            </button>
            <div className="disclaimer-modal__header">
              <div className="disclaimer-modal__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3>Deriv Trading Risk Disclaimer</h3>
            </div>
            
            <div className="disclaimer-modal__body">
              <p>
                Trading multipliers and other derivative products on Deriv involves significant risk of loss and is not suitable for all investors. Before deciding to trade, carefully consider your financial situation and experience level.
              </p>
              
              <h4>Key Risks:</h4>
              <ul>
                <li><strong>Leverage Risk:</strong> Deriv's multiplier products allow you to multiply potential gains, but also magnify potential losses.</li>
                <li><strong>Market Risk:</strong> Financial markets are volatile and can move rapidly in unexpected directions.</li>
                <li><strong>Liquidity Risk:</strong> Some markets may become illiquid, making it difficult to close positions.</li>
                <li><strong>Technical Risk:</strong> System failures, internet connectivity issues, or other technical problems may prevent order execution.</li>
                <li><strong>Regulatory Risk:</strong> Deriv operates under different regulatory frameworks which may affect your rights as a trader.</li>
              </ul>
              
              <h4>Important Considerations:</h4>
              <ul>
                <li>You could lose some or all of your invested capital.</li>
                <li>Never trade with money you cannot afford to lose.</li>
                <li>Past performance is not indicative of future results.</li>
                <li>Seek independent financial advice if you have any doubts about your understanding of these risks.</li>
              </ul>
            </div>
            
            <div className="disclaimer-modal__footer">
              <p>
                By continuing to use this platform, you acknowledge that you have read, understood, and accept these risks associated with trading on Deriv.
              </p>
            </div>
            
            <div className="disclaimer-modal__actions">
              <button
                className="disclaimer-modal__confirm-button"
                onClick={() => setShowDisclaimer(false)}
              >
                I Understand the Risks
              </button>
            </div>
          </div>
        </div>
      )}

      <DesktopWrapper>
        <div className="main__run-strategy-wrapper">
          <RunStrategy />
          {showRunPanel && <RunPanel />}
        </div>
        <ChartModal />
        <TradingViewModal />
      </DesktopWrapper>
      <MobileWrapper>
        <RunPanel />
      </MobileWrapper>
      <Dialog
        cancel_button_text={cancel_button_text || localize("Cancel")}
        confirm_button_text={ok_button_text || localize("Ok")}
        has_close_icon
        is_visible={is_dialog_open}
        onCancel={onCancelButtonClick}
        onClose={onCloseDialog}
        onConfirm={onOkButtonClick || onCloseDialog}
        title={title}
      >
        {message}
      </Dialog>
    </React.Fragment>
  );
});

export default AppWrapper;
