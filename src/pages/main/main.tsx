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
import RunPanel from "../../components/run-panel"
import ChartModal from "../chart/chart-modal"
import Dashboard from "../dashboard"
import RunStrategy from "../dashboard/run-strategy"

const Chart = lazy(() => import("../chart"))
const Tutorial = lazy(() => import("../tutorials"))
const Copytrading = lazy(() => import("../copytrading"))
const Analysis = lazy(() => import("../analysis")) // NEW

const FreeBotsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="url(#blueGrad1)" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect x="4" y="6" width="16" height="12" rx="3" fill="url(#blueGrad1)" />
    <line x1="12" y1="3" x2="12" y2="6" stroke="url(#blueGrad1)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="2" r="1.5" fill="url(#blueGrad1)" />
    <circle cx="9" cy="12" r="1.5" fill="white" />
    <circle cx="15" cy="12" r="1.5" fill="white" />
    <rect x="9" y="15" width="6" height="1.5" rx="0.75" fill="white" opacity="0.9" />
  </svg>
)
const BotSettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="url(#blueGrad2)" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.65l-2-3.46a.5.5 0 0 0-.61-.21l-2.49 1a7.03 7.03 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42l.38 2.65a7.03 7.03 0 0 0-1.69.98l-2.49-1a.5.5 0 0 0-.61.21l-2 3.46a.5.5 0 0 0 .12.65l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.65l2 3.46a.5.5 0 0 0 .61.21l2.49-1c.52.37 1.09.68 1.69.98l.38 2.65A.5.5 0 0 0 10 22h4a.5.5 0 0 0 .5-.42l-.38-2.65c.6-.3 1.17-.61 1.69-.98l2.49 1a.5.5 0 0 0 .61-.21l2-3.46a.5.5 0 0 0-.12-.65l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" fill="url(#blueGrad2)" />
  </svg>
)
const ChartsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="url(#blueGrad3)" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="url(#blueGrad3)" strokeWidth="2" />
    <path
      d="M7 14L10 10L14 15L17 9"
      fill="none"
      stroke="url(#blueGrad3)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7" cy="14" r="1.5" fill="url(#blueGrad3)" />
    <circle cx="10" cy="10" r="1.5" fill="url(#blueGrad3)" />
    <circle cx="14" cy="15" r="1.5" fill="url(#blueGrad3)" />
    <circle cx="17" cy="9" r="1.5" fill="url(#blueGrad3)" />
  </svg>
)
const DCirclesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <path
      d="M12 2a10 10 0 1 1-7.07 2.93"
      fill="none"
      stroke="url(#blueGrad4)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path d="M12 6a6 6 0 1 1-4.24 1.76" fill="none" stroke="url(#blueGrad4)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2.8" fill="url(#blueGrad4)" />
    <circle cx="13" cy="11" r="0.8" fill="white" opacity="0.9" />
  </svg>
)
const AnalysisToolIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="url(#blueGrad5)" strokeWidth="2" />
    <rect x="7" y="14" width="2" height="4" rx="1" fill="url(#blueGrad5)" />
    <rect x="11" y="10" width="2" height="8" rx="1" fill="url(#blueGrad5)" />
    <rect x="15" y="7" width="2" height="11" rx="1" fill="url(#blueGrad5)" />
    <circle cx="18" cy="6" r="3" stroke="url(#blueGrad5)" strokeWidth="2" fill="white" />
    <path d="M20 8L22 10" stroke="url(#blueGrad5)" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const ToolsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2.5L13.5 4.5L16 4L17 6.5L19.5 7.5L19 10L21.5 12L19 14L19.5 16.5L17 17.5L16 20L13.5 19.5L12 21.5L10.5 19.5L8 20L7 17.5L4.5 16.5L5 14L2.5 12L5 10L4.5 7.5L7 6.5L8 4L10.5 4.5L12 2.5Z"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M9 15L12 12M12 12C13.1 12 14 11.1 14 10C14 8.9 13.1 8 12 8C10.9 8 10 8.9 10 10C10 10.55 10.45 11 11 11"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const CopyTradingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="url(#blueGrad6)" strokeWidth="2" />
    <circle cx="12" cy="9" r="2.3" fill="url(#blueGrad6)" />
    <rect x="7.5" y="12.2" width="9" height="5" rx="2.5" fill="url(#blueGrad6)" />
  </svg>
)
const StrategyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad7" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="url(#blueGrad7)" strokeWidth="2" />
    <path d="M8 7H12V17H8C7.45 17 7 16.55 7 16V8C7 7.45 7.45 7 8 7Z" fill="url(#blueGrad7)" />
    <path
      d="M12 7H16C16.55 7 17 7.45 17 8V16C17 16.55 16.55 17 16 17H12V7Z"
      fill="white"
      stroke="url(#blueGrad7)"
      strokeWidth="1.5"
    />
    <line x1="12" y1="7" x2="12" y2="17" stroke="url(#blueGrad7)" strokeWidth="1.5" />
    <path d="M14 7V11L15 10.2L16 11V7H14Z" fill="url(#blueGrad7)" />
  </svg>
)
const SignalsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad8" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="14" rx="2" ry="2" fill="none" stroke="url(#blueGrad8)" strokeWidth="2" />
    <polyline
      points="5,14 8,10 11,12 14,7 17,9 20,6"
      fill="none"
      stroke="url(#blueGrad8)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="19" cy="16.5" r="2.5" fill="url(#blueGrad8)" />
  </svg>
)
const TutorialsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 5C4 4.447 4.447 4 5 4H15C16.105 4 17 4.895 17 6V20C17 20.553 16.553 21 16 21H6C4.895 21 4 20.105 4 19V5Z"
      stroke="#3b82f6"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
    />
    <path
      d="M17 6H19C20.105 6 21 6.895 21 8V20C21 20.553 20.553 21 20 21H17"
      stroke="#3b82f6"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="12" r="3" fill="#3b82f6" />
    <polygon points="9,10.5 12,12 9,13.5" fill="white" />
  </svg>
)
const YouTubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2c.32-1.77.46-3.55.46-5.33s-.14-3.56-.46-5.33z"
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
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.051-.173-.29-.018-.447.13-.597.134-.134.299-.349.448-.524.149-.175.198-.299.298-.498.099-.198.05-.373-.025-.522-.075-.149-.669-1.614-.917-2.214-.242-.582-.491-.503-.669-.513-.173-.009-.373-.011-.573-.011-.198 0-.522.075-.796.373-.273.298-1.045 1.021-1.045 2.487 0 1.466 1.07 2.883 1.219 3.083.149.199 2.118 3.231 5.13 4.4.718.25 1.282.399 1.722.509.722.183 1.381.157 1.903.095.58-.07 1.758-.719 2.006-1.413.249-.694.249-1.288.173-1.413-.074-.126-.272-.199-.57-.348z"
      fill="#25D366"
    />
  </svg>
)
const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.7-1.42 3.75-1.38 1.64-3.74 2.1-5.58 1.04-1.98-1.12-2.98-3.61-2.29-5.77.56-1.75 2.18-3.06 4.04-3.02.01.99.01 1.98.02 2.97-.89-.02-1.65.81-1.63 1.7.06 1.11 1.69 1.55 2.37.59.15-.23.17-.53.17-.81V.02z"
      fill="#000000"
    />
  </svg>
)
const TelegramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-12S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.69 1.03-.58.05-1-.39-1.56-.76-.86-.56-1.35-.91-2.19-1.46-.96-.63-.34-1.01.21-1.07.37-.04 1.58-.49 1.63-.67.05-.18.47-1.92.46-2-.01-.08-.09-.18-.19-.21-.09-.03-2.01-.64-2.71-.87-.18-.05-.41-.12-.41-.28.01-.12.17-.25.29-.34.13-.1.28-.13.36-.13.08 0 .18.01.29.05.09.03.23.08.35.13.25.11.94.36 2.03.74.82.28 1.74.6 1.83.63.08.03.16.06.2.13.04.06.04.16.02.22z"
      fill="#0088CC"
    />
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
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const analysisUrl = "https://mesoflixldpnew.vercel.app/"
  const strategyUrl = "https://mesoflixstrategies.netlify.app/"
  const toolsUrl = "https://alltools-ten.vercel.app/"

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
        "Osam_Digit_Switcher🤖🤖.xml",
        "Under-Destroyer💀.xml",
        "Over-Destroyer💀.xml",
        "the Astro E_O🤖.xml",
        "Mega_Mind V1👻.xml",
        "Osam.HnR.xml",
        "Auto Bot by Osam💯.xml",
        "DEC_entry_Point.xml",
        "Over_HitnRun🤖.xml",
        "Under_HitnRun.xml",
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
  }, [
    "Osam_Digit_Switcher🤖🤖.xml",
    "Under-Destroyer💀.xml",
    "Over-Destroyer💀.xml",
    "the Astro E_O🤖.xml",
    "Osam.HnR.xml",
    "Auto Bot by Osam💯.xml",
    "DEC_entry_Point.xml",
    "Over_HitnRun🤖.xml",
    "Under 8 pro bot💯.xml",
  ])

  const formatBotName = (name) => {
    return name.replace(/\.xml$/, "")
  }

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
        <div className="main__container">
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FreeBotsIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Free Bots" />
                  </span>
                </div>
              }
              id="id-free-bots"
            >
              <div className="free-bots">
                {/* Social Media Icons */}
                <div className="social-media-container">
                  <a
                    href="https://youtube.com/@osamtradinghub-cl1fs?si=JSF3lDV1TBzjUTTb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon youtube-icon"
                  >
                    <YouTubeIcon />
                  </a>
                  <a
                    href="https://www.instagram.com/osamtradinghub.com1?igsh=Mmh2aW43a3dpamRq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon instagram-icon"
                  >
                    <InstagramIcon />
                  </a>
                  <a
                    href="https://chat.whatsapp.com/E2cZOyZr75VExcbkprwuTe?mode=ac_t"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon whatsapp-icon"
                  >
                    <WhatsAppIcon />
                  </a>
                  <a
                    href="https://www.tiktok.com/@_its_osam?_t=ZM-8yu0PcOKRHR&_r=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon tiktok-icon"
                  >
                    <TikTokIcon />
                  </a>
                  <a
                    href="https://t.me/+dLoQvTnT_2wzOGY0"
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
                      <div
                        key={index}
                        className="free-bot-item"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                        }}
                      >
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BotSettingsIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Bot Settings" />
                  </span>
                </div>
              }
              id="id-bot-settings"
            >
              <Dashboard handleTabChange={handleTabChange} />
              <button onClick={handleOpen}>Load Bot</button>
            </div>

            {/* 3. Charts */}
            <div
              label={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ChartsIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Charts" />
                  </span>
                </div>
              }
              id="id-charts"
            >
              <Suspense fallback={<ChunkLoader message={localize("Please wait, loading chart...")} />}>
                <Chart show_digits_stats={false} />
              </Suspense>
            </div>

            {/* 4. Dcircles - now loads from analysis folder */}
            <div
              label={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <DCirclesIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Dcircles" />
                  </span>
                </div>
              }
              id="id-dcircles"
            >

               
              <Suspense fallback={<ChunkLoader message={localize("Please wait, loading Dcircles...")} />}>
                <Analysis />
              </Suspense>
            </div>

            {/* 5. Analysis */}
            <div
              label={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AnalysisToolIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Analysis" />
                  </span>
                </div>
              }
              id="id-analysis"
            >
              <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
                <iframe
                  src={analysisUrl}
                  width="100%"
                  height="100%"
                  title="Analysis"
                  style={{
                    border: "none",
                    display: "block",
                    minHeight: "calc(100vh - 60px)",
                    background: "#dbeafe",
                  }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 6. Tools */}
            <div
              label={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ToolsIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Tools" />
                  </span>
                </div>
              }
              id="id-tools"
            >
              <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
                <iframe
                  src={toolsUrl}
                  width="100%"
                  height="100%"
                  title="Tools"
                  style={{
                    border: "none",
                    display: "block",
                    minHeight: "calc(100vh - 60px)",
                    background: "#eff6ff",
                  }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 7. Copytrading */}
            <div
              label={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CopyTradingIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Copytrading" />
                  </span>
                </div>
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <StrategyIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Strategy" />
                  </span>
                </div>
              }
              id="id-strategy"
            >
              <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
                <iframe
                  src={strategyUrl}
                  width="100%"
                  height="100%"
                  title="Strategy"
                  style={{
                    border: "none",
                    display: "block",
                    minHeight: "calc(100vh - 60px)",
                    background: "#dbeafe",
                  }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 9. Signals */}
            <div
              label={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <SignalsIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Signals" />
                  </span>
                </div>
              }
              id="id-signals"
            >
              <div
                className={classNames("dashboard__chart-wrapper", {
                  "dashboard__chart-wrapper--expanded": is_drawer_open && isDesktop,
                  "dashboard__chart-wrapper--modal": is_chart_modal_visible && isDesktop,
                })}
                style={{ height: "100%", overflow: "hidden" }}
              >
                <iframe
                  src="signals"
                  width="100%"
                  height="100%"
                  style={{
                    border: "none",
                    display: "block",
                    minHeight: "calc(100vh - 60px)",
                    background: "#eff6ff",
                  }}
                  scrolling="yes"
                />
              </div>
            </div>

            {/* 10. Tutorials - Last */}
            <div
              label={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <TutorialsIcon />
                  <span style={{ color: "#000000", fontWeight: "600", fontSize: "14px" }}>
                    <Localize i18n_default_text="Tutorials" />
                  </span>
                </div>
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

      {/* Enhanced Risk Disclaimer Modal */}
      {showDisclaimer && (
        <div className="disclaimer-overlay">
          <div className="disclaimer-modal">
            <button onClick={() => setShowDisclaimer(false)} className="disclaimer-close-button">
              ×
            </button>
            <div className="disclaimer-header">
              <div className="disclaimer-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="disclaimer-title">Trading Risk Disclaimer</h3>
            </div>
            <div className="disclaimer-content">
              <p className="disclaimer-intro">
                Trading multipliers and other derivative products on Deriv involves significant risk of loss and is not
                suitable for all investors. Before deciding to trade, carefully consider your financial situation and
                experience level.
              </p>
              <h4 className="disclaimer-subtitle">Key Risks:</h4>
              <ul className="disclaimer-list">
                <li>
                  <strong>Leverage Risk:</strong> Deriv's multiplier products allow you to multiply potential gains, but
                  also magnify potential losses.
                </li>
                <li>
                  <strong>Market Risk:</strong> Financial markets are volatile and can move rapidly in unexpected
                  directions.
                </li>
                <li>
                  <strong>Liquidity Risk:</strong> Some markets may become illiquid, making it difficult to close
                  positions.
                </li>
                <li>
                  <strong>Technical Risk:</strong> System failures, internet connectivity issues, or other technical
                  problems may prevent order execution.
                </li>
                <li>
                  <strong>Regulatory Risk:</strong> Deriv operates under different regulatory frameworks which may
                  affect your rights as a trader.
                </li>
              </ul>
              <h4 className="disclaimer-subtitle">Important Considerations:</h4>
              <ul className="disclaimer-list">
                <li>You could lose some or all of your invested capital.</li>
                <li>Never trade with money you cannot afford to lose.</li>
                <li>Past performance is not indicative of future results.</li>
                <li>
                  Seek independent financial advice if you have any doubts about your understanding of these risks.
                </li>
              </ul>
            </div>
            <div className="disclaimer-notice">
              <p className="disclaimer-notice-text">
                By continuing to use this platform, you acknowledge that you have read, understood, and accept these
                risks associated with trading on Deriv.
              </p>
            </div>
            <div className="disclaimer-footer">
              <button onClick={() => setShowDisclaimer(false)} className="disclaimer-accept-button">
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
      <button onClick={() => setShowDisclaimer(true)} className="risk-disclaimer-button" style={{ bottom: "20px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Risk
      </button>
    </React.Fragment>
  )
})

export default AppWrapper
