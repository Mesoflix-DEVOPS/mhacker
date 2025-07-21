

import React, { lazy, Suspense, useEffect, useState, useCallback } from "react"
import classNames from "classnames"
import { observer } from "mobx-react-lite"
import ChunkLoader from "@/components/loader/chunk-loader"
import DesktopWrapper from "@/components/shared_ui/desktop-wrapper"
import Dialog from "@/components/shared_ui/dialog"
import MobileWrapper from "@/components/shared_ui/mobile-wrapper"
import Tabs from "@/components/shared_ui/tabs/tabs"
import TradingViewModal from "@/components/trading-view-chart/trading-view-modal"
import { DBOT_TABS } from "@/constants/bot-contents"
import { api_base, updateWorkspaceName } from "@/external/bot-skeleton"
import { CONNECTION_STATUS } from "@/external/bot-skeleton/services/api/observables/connection-status-stream"
import { useApiBase } from "@/hooks/useApiBase"
import { useStore } from "@/hooks/useStore"
import { Localize, localize } from "@deriv-com/translations"
import { useDevice } from "@deriv-com/ui"
import RunPanel from "../../components/run-panel"
import ChartModal from "../chart/chart-modal"
import Dashboard from "../dashboard"
import RunStrategy from "../dashboard/run-strategy"

const Chart = lazy(() => import("../chart"))
const Tutorial = lazy(() => import("../tutorials"))
const Copytrading = lazy(() => import("../copytrading"))

/** NEW BLUE-THEMED ICONS **/
const FreeBotsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="4" y="6" width="16" height="12" rx="3" fill="#1E40AF" stroke="#3B82F6" strokeWidth="1.5" />
    <circle cx="8" cy="10" r="1.5" fill="#60A5FA" />
    <circle cx="16" cy="10" r="1.5" fill="#60A5FA" />
    <rect x="6" y="14" width="12" height="2" rx="1" fill="#3B82F6" />
    <rect x="10" y="18" width="4" height="2" rx="1" fill="#1E40AF" />
  </svg>
)

const DashboardIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="#DBEAFE" stroke="#1E40AF" strokeWidth="2" />
    <path d="M9 22V12h6v10" stroke="#3B82F6" strokeWidth="2" fill="#93C5FD" />
    <circle cx="12" cy="8" r="1" fill="#1E40AF" />
  </svg>
)

const ChartsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="12" width="3" height="8" rx="1" fill="#1E40AF" />
    <rect x="7" y="8" width="3" height="12" rx="1" fill="#3B82F6" />
    <rect x="11" y="4" width="3" height="16" rx="1" fill="#60A5FA" />
    <rect x="15" y="10" width="3" height="10" rx="1" fill="#93C5FD" />
    <rect x="19" y="6" width="3" height="14" rx="1" fill="#DBEAFE" />
  </svg>
)

const DCirclesIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#1E40AF" strokeWidth="2" fill="#DBEAFE" />
    <circle cx="12" cy="12" r="7" stroke="#3B82F6" strokeWidth="2" fill="#93C5FD" />
    <circle cx="12" cy="12" r="4" stroke="#60A5FA" strokeWidth="2" fill="#DBEAFE" />
    <circle cx="12" cy="12" r="1.5" fill="#1E40AF" />
  </svg>
)

const AnalysisToolIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#1E40AF" strokeWidth="2" fill="none" />
    <path d="M12 2a10 10 0 0110 10h-10z" fill="#3B82F6" />
    <path d="M12 12v10A10 10 0 012 12h10z" fill="#60A5FA" />
    <path d="M12 12L22 12A10 10 0 0112 2v10z" fill="#93C5FD" />
  </svg>
)

const CopyTradingIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="3" width="10" height="10" rx="2" fill="#DBEAFE" stroke="#1E40AF" strokeWidth="1.5" />
    <rect x="11" y="11" width="10" height="10" rx="2" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1.5" />
    <path d="M7 7h2M7 9h3" stroke="#1E40AF" strokeWidth="1.5" />
    <path d="M15 15h2M15 17h3" stroke="#1E40AF" strokeWidth="1.5" />
    <path d="M13 3v8M21 11h-8" stroke="#60A5FA" strokeWidth="2" />
  </svg>
)

const StrategyIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path
      d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"
      fill="#DBEAFE"
      stroke="#1E40AF"
      strokeWidth="1.5"
    />
    <path d="M8 12l2 2 4-4" stroke="#3B82F6" strokeWidth="2" fill="none" />
    <circle cx="12" cy="8" r="1" fill="#1E40AF" />
  </svg>
)

const SignalsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="18" r="2" fill="#1E40AF" />
    <path d="M12 16v-4" stroke="#3B82F6" strokeWidth="2" />
    <path d="M8 13a6 6 0 018 0" stroke="#60A5FA" strokeWidth="2" fill="none" />
    <path d="M5 10a9 9 0 0114 0" stroke="#93C5FD" strokeWidth="2" fill="none" />
    <path d="M2 7a12 12 0 0120 0" stroke="#DBEAFE" strokeWidth="2" fill="none" />
  </svg>
)

const TutorialsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#1E40AF" strokeWidth="2" fill="#DBEAFE" />
    <polygon points="10,8 16,12 10,16" fill="#3B82F6" />
    <circle cx="12" cy="12" r="6" stroke="#60A5FA" strokeWidth="1" fill="none" />
  </svg>
)

const AppWrapper = observer(() => {
  const { connectionStatus } = useApiBase()
  const { dashboard, load_modal, run_panel, summary_card } = useStore()
  const { active_tab, is_chart_modal_visible, is_trading_view_modal_visible, setActiveTab } = dashboard
  const { onEntered } = load_modal
  const {
    is_dialog_open,
    dialog_options,
    onCancelButtonClick,
    onCloseDialog,
    onOkButtonClick,
    stopBot,
    is_drawer_open,
  } = run_panel
  const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string }
  const { clear } = summary_card
  const { isDesktop } = useDevice()
  const [bots, setBots] = useState([])
  const analysisUrl = "https://mesoflixldpnew.vercel.app/"
  const dcirclesUrl = "https://nilotetrader.netlify.app/"
  const strategyUrl = "https://mesoflixstrategies.netlify.app/"

  useEffect(() => {
    if (connectionStatus !== CONNECTION_STATUS.OPENED) {
      const is_bot_running = document.getElementById("db-animation__stop-button") !== null
      if (is_bot_running) {
        clear()
        stopBot()
        api_base.setIsRunning(false)
      }
    }
  }, [clear, connectionStatus, stopBot])

  useEffect(() => {
    const fetchBots = async () => {
      const botFiles = [
        "Auto Bot by Osam__ update .xml",
        "dec  entry point.xml",
        "Osam Digit_switcher.xml",
        "Osam.HnR.xml",
        "Osam_Digit_Ticker.xml",
        "Under 8 pro bot💯.xml",
      ]
      const botPromises = botFiles.map(async (file) => {
        try {
          const response = await fetch(file)
          if (!response.ok) {
            throw new Error(`Failed to fetch ${file}: ${response.statusText}`)
          }
          const text = await response.text()
          const parser = new DOMParser()
          const xml = parser.parseFromString(text, "application/xml")
          return {
            title: file.split("/").pop(),
            image: xml.getElementsByTagName("image")[0]?.textContent || "default_image_path",
            filePath: file,
            xmlContent: text,
          }
        } catch (error) {
          console.error(error)
          return null
        }
      })
      const bots = (await Promise.all(botPromises)).filter(Boolean)
      setBots(bots)
    }
    fetchBots()
  }, [])

  const handleTabChange = React.useCallback(
    (tab_index: number) => {
      setActiveTab(tab_index)
    },
    [setActiveTab],
  )

  const handleBotClick = useCallback(
    async (bot: { filePath: string; xmlContent: string }) => {
      setActiveTab(DBOT_TABS.BOT_BUILDER)
      try {
        if (typeof load_modal.loadFileFromContent === "function") {
          try {
            await load_modal.loadFileFromContent(bot.xmlContent)
          } catch (loadError) {
            console.error("Error in load_modal.loadFileFromContent:", loadError)
          }
        } else {
          console.error("loadFileFromContent is not defined on load_modal")
        }
        updateWorkspaceName(bot.xmlContent)
      } catch (error) {
        console.error("Error loading bot file:", error)
      }
    },
    [setActiveTab, load_modal, updateWorkspaceName],
  )

  const handleOpen = useCallback(async () => {
    await load_modal.loadFileFromRecent()
    setActiveTab(DBOT_TABS.BOT_BUILDER)
  }, [load_modal, setActiveTab])

  const showRunPanel = [1, 2, 3, 4].includes(active_tab)

  return (
    <React.Fragment>
      <div className="main">
        <div className="main__container" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
          <Tabs
            active_index={active_tab}
            className="main__tabs"
            onTabItemChange={onEntered}
            onTabItemClick={handleTabChange}
            top
          >
            {/* 1. Free Bots - First */}
            <div
              label={
                <>
                  <FreeBotsIcon />
                  <Localize i18n_default_text="Free Bots" />
                </>
              }
              id="id-free-bots"
            >
              <div
                className="free-bots"
                style={{
                  padding: "16px",
                  background: "linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)",
                  minHeight: "100vh",
                  width: "100%",
                }}
              >
                <h2
                  className="free-bots__heading"
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#1E40AF",
                    textAlign: "center",
                    marginBottom: "24px",
                    textShadow: "0 2px 4px rgba(30, 64, 175, 0.1)",
                  }}
                >
                  <Localize i18n_default_text="Free Trading Bots" />
                </h2>
                <div className="free-bots__content-wrapper" style={{ width: "100%" }}>
                  <div
                    className="free-bots__content"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      width: "100%",
                      maxWidth: "100%",
                    }}
                  >
                    {bots.map((bot, index) => (
                      <div
                        className="free-bot"
                        key={index}
                        style={{
                          background: "white",
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: "0 4px 16px rgba(30, 64, 175, 0.12)",
                          border: "2px solid #E5E7EB",
                          transition: "all 0.3s ease",
                          cursor: "default",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", flex: "1", minWidth: "200px" }}>
                          <div
                            style={{
                              background: "linear-gradient(135deg, #3B82F6, #1E40AF)",
                              borderRadius: "8px",
                              padding: "8px",
                              marginRight: "12px",
                              flexShrink: 0,
                            }}
                          >
                            <FreeBotsIcon />
                          </div>
                          <div className="free-bot__details" style={{ flex: 1 }}>
                            <h3
                              className="free-bot__title"
                              style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#1E40AF",
                                margin: "0",
                                lineHeight: "1.4",
                                wordBreak: "break-word",
                              }}
                            >
                              {bot.title}
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBotClick(bot)}
                          style={{
                            background: "linear-gradient(135deg, #3B82F6, #1E40AF)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 20px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                            flexShrink: 0,
                            minWidth: "80px",
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = "translateY(-1px)"
                            e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)"
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = "translateY(0)"
                            e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)"
                          }}
                        >
                          Load Bot
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Dashboard */}
            <div
              label={
                <>
                  <DashboardIcon />
                  <Localize i18n_default_text="Dashboard" />
                </>
              }
              id="id-dbot-dashboard"
            >
              <Dashboard handleTabChange={handleTabChange} />
              <button onClick={handleOpen}>Load Bot</button>
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
              <div style={{ width: "100%", height: 600 }}>
                <iframe
                  src={dcirclesUrl}
                  width="100%"
                  height="100%"
                  title="Dcircles"
                  style={{ border: "none", display: "block", borderRadius: 16, background: "#f0f4fa" }}
                  scrolling="yes"
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
              <div style={{ width: "100%", height: 600 }}>
                <iframe
                  src={analysisUrl}
                  width="100%"
                  height="100%"
                  title="Analysis"
                  style={{ border: "none", display: "block" }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 6. Copytrading */}
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

            {/* 7. Strategies */}
            <div
              label={
                <>
                  <StrategyIcon />
                  <Localize i18n_default_text="Strategy" />
                </>
              }
              id="id-strategy"
            >
              <div style={{ width: "100%", height: 600 }}>
                <iframe
                  src={strategyUrl}
                  width="100%"
                  height="100%"
                  title="Strategy"
                  style={{ border: "none", display: "block", borderRadius: 16, background: "#f8f7ff" }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 8. Signals */}
            <div
              label={
                <>
                  <SignalsIcon />
                  <Localize i18n_default_text="Signals" />
                </>
              }
              id="id-signals"
            >
              <div
                className={classNames("dashboard__chart-wrapper", {
                  "dashboard__chart-wrapper--expanded": is_drawer_open && isDesktop,
                  "dashboard__chart-wrapper--modal": is_chart_modal_visible && isDesktop,
                })}
              >
                <iframe
                  src="signals"
                  width="100%"
                  height="600px"
                  style={{ border: "none", display: "block" }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 9. Tutorials - Last */}
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
  )
})

export default AppWrapper
