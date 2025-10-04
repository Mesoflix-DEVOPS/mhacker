"use client"

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
import RunPanel from "@/components/run-panel"
import ChartModal from "@/components/chart/chart-modal"
import Dashboard from "@/components/dashboard"
import RunStrategy from "@/components/dashboard/run-strategy"
import FreeBotsIcon from "@/components/icons/free-bots-icon" // Declare the variable before using it
import YouTubeIcon from "@/components/icons/youtube-icon" // Declare the variable before using it
import InstagramIcon from "@/components/icons/instagram-icon" // Declare the variable before using it
import WhatsAppIcon from "@/components/icons/whatsapp-icon" // Declare the variable before using it
import TikTokIcon from "@/components/icons/tiktok-icon" // Declare the variable before using it
import TelegramIcon from "@/components/icons/telegram-icon" // Declare the variable before using it
import BotSettingsIcon from "@/components/icons/bot-settings-icon" // Declare the variable before using it
import ChartsIcon from "@/components/icons/charts-icon" // Declare the variable before using it
import DCirclesIcon from "@/components/icons/dcircles-icon" // Declare the variable before using it
import MToolIcon from "@/components/icons/mtool-icon" // Declare the variable before using it
import AnalysisToolIcon from "@/components/icons/analysis-tool-icon" // Declare the variable before using it
import ToolsIcon from "@/components/icons/tools-icon" // Declare the variable before using it
import CopyTradingIcon from "@/components/icons/copy-trading-icon" // Declare the variable before using it
import StrategyIcon from "@/components/icons/strategy-icon" // Declare the variable before using it
import SignalsIcon from "@/components/icons/signals-icon" // Declare the variable before using it
import TutorialsIcon from "@/components/icons/tutorials-icon" // Declare the variable before using it

const Chart = lazy(() => import("../chart"))
const Tutorial = lazy(() => import("../tutorials"))
const Copytrading = lazy(() => import("../copytrading"))
const Dcircles = lazy(() => import("../analysis"))
const Advanced = lazy(() => import("../advanced"))

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
  const { isDesktop, isMobile } = useDevice()
  const [bots, setBots] = useState([])
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const analysisUrl = "https://mesoflixldpnew.vercel.app/"
  const mtoolUrl = "https://your-mtool-url.com/" // Replace with your MTool URL
  const strategyUrl = "https://mesoflixstrategies.netlify.app/"
  const toolsUrl = "https://alltools-ten.vercel.app/"

  useEffect(() => {
    if (active_tab !== undefined && active_tab !== null) {
      localStorage.setItem("dbot_active_tab", active_tab.toString())
    }
  }, [active_tab])

  useEffect(() => {
    const savedTab = localStorage.getItem("dbot_active_tab")
    if (savedTab !== null) {
      const tabIndex = Number.parseInt(savedTab, 10)
      if (!isNaN(tabIndex) && tabIndex !== active_tab) {
        setActiveTab(tabIndex)
      }
    }
  }, []) // Only run on mount

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
        "AUTO Under 9 _ Under 3 D.Bot.xml",
        "EPIC 2prediction BOT🤑🥂.xml",
        "Deriv wizard 1.xml",
        "Titan v3.xml",
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

  const formatBotName = (name: string) => name.replace(/\.xml$/, "")

  const handleTabChange = useCallback((tab_index: number) => setActiveTab(tab_index), [setActiveTab])

  const handleBotClick = useCallback(
    async (bot: { filePath: string; xmlContent: string }) => {
      setActiveTab(DBOT_TABS.BOT_BUILDER)
      try {
        if (typeof load_modal.loadFileFromContent === "function") {
          await load_modal.loadFileFromContent(bot.xmlContent)
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

  // Responsive style for full height/width and scroll for tab panels
  const fullPanelStyle: React.CSSProperties = {
    width: "100%",
    height: isMobile ? "calc(100vh - 54px)" : "calc(100vh - 60px)",
    minHeight: isMobile ? "calc(100vh - 54px)" : "calc(100vh - 60px)",
    maxHeight: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "#f0fdf4",
  }

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
                {/* Social Media Icons */}
                <div className="social-media-container">
                  <a
                    href="https://youtube.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon youtube-icon"
                  >
                    <YouTubeIcon />
                  </a>
                  <a
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon instagram-icon"
                  >
                    <InstagramIcon />
                  </a>
                  <a
                    href="https://whatsapp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon whatsapp-icon"
                  >
                    <WhatsAppIcon />
                  </a>
                  <a
                    href="https://www.tiktok.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon tiktok-icon"
                  >
                    <TikTokIcon />
                  </a>
                  <a
                    href="https://t.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon telegram-icon"
                  >
                    <TelegramIcon />
                  </a>
                </div>
                <div className="free-bots__content-wrapper">
                  <div className="free-bots__content">
                    {bots.map((bot, index) => (
                      <div key={index} className="free-bot-item" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="gradient-border" />
                        <div className="bot-info">
                          <div className="bot-icon-container">
                            <FreeBotsIcon />
                          </div>
                          <div className="bot-details">
                            <h3 className="bot-title">{formatBotName(bot.title)}</h3>
                            <p className="bot-status">Ready to deploy • Click to load</p>
                          </div>
                        </div>
                        <button onClick={() => handleBotClick(bot)} className="load-bot-button">
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
              <Suspense fallback={<ChunkLoader message={localize("Please wait, loading Dcircles...")} />}>
                <div style={fullPanelStyle}>
                  <Dcircles />
                </div>
              </Suspense>
            </div>

            {/* 5. MTool */}
            <div
              label={
                <>
                  <MToolIcon />
                  <Localize i18n_default_text="MTool" />
                </>
              }
              id="id-mtool"
            >
              <Suspense fallback={<ChunkLoader message={localize("Please wait, loading MTool...")} />}>
                <div style={fullPanelStyle}>
                  <Advanced />
                </div>
              </Suspense>
            </div>

            {/* 6. Analysis */}
            <div
              label={
                <>
                  <AnalysisToolIcon />
                  <Localize i18n_default_text="Analysis" />
                </>
              }
              id="id-analysis"
            >
              <div style={fullPanelStyle}>
                <iframe
                  src={analysisUrl}
                  width="100%"
                  height="100%"
                  title="Analysis"
                  style={{
                    border: "none",
                    display: "block",
                    background: "#f0f9ff",
                  }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 7. Tools */}
            <div
              label={
                <>
                  <ToolsIcon />
                  <Localize i18n_default_text="Tools" />
                </>
              }
              id="id-tools"
            >
              <div style={fullPanelStyle}>
                <iframe
                  src={toolsUrl}
                  width="100%"
                  height="100%"
                  title="Tools"
                  style={{
                    border: "none",
                    display: "block",
                    background: "#f0fdf4",
                  }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 8. Copytrading */}
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

            {/* 9. Strategies */}
            <div
              label={
                <>
                  <StrategyIcon />
                  <Localize i18n_default_text="Strategy" />
                </>
              }
              id="id-strategy"
            >
              <div style={fullPanelStyle}>
                <iframe
                  src={strategyUrl}
                  width="100%"
                  height="100%"
                  title="Strategy"
                  style={{
                    border: "none",
                    display: "block",
                    background: "#f0f9ff",
                  }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 10. Signals */}
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
                style={fullPanelStyle}
              >
                <iframe
                  src="signals"
                  width="100%"
                  height="100%"
                  style={{
                    border: "none",
                    display: "block",
                    background: "#f0fdf4",
                  }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 11. Tutorials */}
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

      {/* Risk Disclaimer Button */}
      <button
        onClick={() => setShowDisclaimer(true)}
        className="risk-disclaimer-button"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "linear-gradient(135deg, #F59E0B, #EF4444)",
          color: "white",
          border: "none",
          borderRadius: "20px",
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.05)"
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)"
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)"
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Disclaimer
      </button>

      {/* Risk Disclaimer Modal */}
      {showDisclaimer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <button
              onClick={() => setShowDisclaimer(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#6B7280",
              }}
            >
              ×
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  background: "#FEE2E2",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1F2937", margin: 0 }}>
                Deriv Trading Risk Disclaimer
              </h3>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <p style={{ lineHeight: "1.6", color: "#4B5563", marginBottom: "12px" }}>
                Trading multipliers and other derivative products on Deriv involves significant risk of loss and is not
                suitable for all investors. Before deciding to trade, carefully consider your financial situation and
                experience level.
              </p>
              <h4 style={{ color: "#1F2937", margin: "12px 0 8px 0" }}>Key Risks:</h4>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.6", color: "#4B5563", marginBottom: "16px" }}>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Leverage Risk:</strong> Deriv's multiplier products allow you to multiply potential gains, but
                  also magnify potential losses.
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Market Risk:</strong> Financial markets are volatile and can move rapidly in unexpected
                  directions.
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Liquidity Risk:</strong> Some markets may become illiquid, making it difficult to close
                  positions.
                </li>
                <li style={{ marginBottom: "8px" }}>
                  <strong>Technical Risk:</strong> System failures, internet connectivity issues, or other technical
                  problems may prevent order execution.
                </li>
                <li>
                  <strong>Regulatory Risk:</strong> Deriv operates under different regulatory frameworks which may
                  affect your rights as a trader.
                </li>
              </ul>
              <h4 style={{ color: "#1F2937", margin: "12px 0 8px 0" }}>Important Considerations:</h4>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.6", color: "#4B5563" }}>
                <li style={{ marginBottom: "8px" }}>You could lose some or all of your invested capital.</li>
                <li style={{ marginBottom: "8px" }}>Never trade with money you cannot afford to lose.</li>
                <li style={{ marginBottom: "8px" }}>Past performance is not indicative of future results.</li>
                <li>
                  Seek independent financial advice if you have any doubts about your understanding of these risks.
                </li>
              </ul>
            </div>
            <div style={{ backgroundColor: "#F3F4F6", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <p style={{ fontSize: "14px", color: "#6B7280", fontStyle: "italic", margin: 0, lineHeight: "1.5" }}>
                By continuing to use this platform, you acknowledge that you have read, understood, and accept these
                risks associated with trading on Deriv.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDisclaimer(false)}
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
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
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
  )
})

export default AppWrapper
