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

/** BEAUTIFUL MODERN ICONS **/
const FreeBotsIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" fill="url(#grad1)" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c6ff" stop-opacity="1" />
      <stop offset="100%" stop-color="#0072ff" stop-opacity="1" />
    </linearGradient>
  </defs>
  <rect x="4" y="6" width="16" height="12" rx="3" fill="url(#grad1)"/>
  <line x1="12" y1="3" x2="12" y2="6" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="2" r="1.5" fill="url(#grad1)"/>
  <circle cx="9" cy="12" r="1.5" fill="white"/>
  <circle cx="15" cy="12" r="1.5" fill="white"/>
  <rect x="9" y="15" width="6" height="1.5" rx="0.75" fill="white" opacity="0.9"/>
</svg>


)

const BotSettingsIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" fill="url(#grad1)" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c6ff" />
      <stop offset="100%" stop-color="#0072ff" />
    </linearGradient>
  </defs>
  <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.65l-2-3.46a.5.5 0 0 0-.61-.21l-2.49 1a7.03 7.03 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42l-.38 2.65a7.03 7.03 0 0 0-1.69.98l-2.49-1a.5.5 0 0 0-.61.21l-2 3.46a.5.5 0 0 0 .12.65l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.65l2 3.46a.5.5 0 0 0 .61.21l2.49-1c.5.4 1.07.73 1.69.98l.38 2.65A.5.5 0 0 0 10 22h4c.25 0 .46-.18.5-.42l.38-2.65c.62-.25 1.19-.58 1.69-.98l2.49 1a.5.5 0 0 0 .61-.21l2-3.46a.5.5 0 0 0-.12-.65l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"/>
</svg>

)

const ChartsIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" fill="url(#grad1)" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c6ff" />
      <stop offset="100%" stop-color="#0072ff" />
    </linearGradient>
  </defs>
  <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="url(#grad1)" stroke-width="2"/>
  <path d="M7 14L10 10L14 15L17 9" fill="none" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="7" cy="14" r="1.5" fill="url(#grad1)"/>
  <circle cx="10" cy="10" r="1.5" fill="url(#grad1)"/>
  <circle cx="14" cy="15" r="1.5" fill="url(#grad1)"/>
  <circle cx="17" cy="9" r="1.5" fill="url(#grad1)"/>
</svg>

)

const DCirclesIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c6ff" />
      <stop offset="100%" stop-color="#0072ff" />
    </linearGradient>
  </defs>
  <path d="M12 2a10 10 0 1 1-7.07 2.93" fill="none" stroke="url(#grad1)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12 6a6 6 0 1 1-4.24 1.76" fill="none" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="2.8" fill="url(#grad1)"/>
    <circle cx="13" cy="11" r="0.8" fill="white" opacity="0.9"/>
</svg>

)

const AnalysisToolIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c6ff" />
      <stop offset="100%" stop-color="#0072ff" />
    </linearGradient>
  </defs>
  <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="url(#grad1)" stroke-width="2"/>
 <rect x="7" y="14" width="2" height="4" rx="1" fill="url(#grad1)"/>
  <rect x="11" y="10" width="2" height="8" rx="1" fill="url(#grad1)"/>
  <rect x="15" y="7" width="2" height="11" rx="1" fill="url(#grad1)"/>
    <circle cx="18" cy="6" r="3" stroke="url(#grad1)" stroke-width="2" fill="white"/>
  <path d="M20 8L22 10" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round"/>
</svg>

)

const ToolsIcon = () => (
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2.5L13.5 4.5L16 4L17 6.5L19.5 7.5L19 10L21.5 12L19 14L19.5 16.5L17 17.5L16 20L13.5 19.5L12 21.5L10.5 19.5L8 20L7 17.5L4.5 16.5L5 14L2.5 12L5 10L4.5 7.5L7 6.5L8 4L10.5 4.5L12 2.5Z" 
    stroke="#1976D2" stroke-width="2" stroke-linejoin="round"/>
  <path d="M9 15L12 12M12 12C13.1 12 14 11.1 14 10C14 8.9 13.1 8 12 8C10.9 8 10 8.9 10 10C10 10.55 10.45 11 11 11" 
    stroke="#1976D2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

)

const CopyTradingIcon = () => (
 <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c6ff"/>
      <stop offset="100%" stop-color="#0072ff"/>
    </linearGradient>
  </defs>
  <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="url(#grad1)" stroke-width="2"/>
  <circle cx="12" cy="9" r="2.3" fill="url(#grad1)"/>
  <rect x="7.5" y="12.2" width="9" height="5" rx="2.5" fill="url(#grad1)"/>
</svg>

)

const StrategyIcon = () => (
 <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c6ff" />
      <stop offset="100%" stop-color="#0072ff" />
    </linearGradient>
  </defs>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="url(#grad1)" stroke-width="2"/>
  <path d="M8 7H12V17H8C7.45 17 7 16.55 7 16V8C7 7.45 7.45 7 8 7Z" fill="url(#grad1)"/>
  <path d="M12 7H16C16.55 7 17 7.45 17 8V16C17 16.55 16.55 17 16 17H12V7Z" fill="white" stroke="url(#grad1)" stroke-width="1.5"/>
  <line x1="12" y1="7" x2="12" y2="17" stroke="url(#grad1)" stroke-width="1.5"/>
  <path d="M14 7V11L15 10.2L16 11V7H14Z" fill="url(#grad1)"/>
</svg>

)

const SignalsIcon = () => (
 <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00B4DB"/>
      <stop offset="100%" stop-color="#0083B0"/>
    </linearGradient>
  </defs>
  <rect x="3" y="4" width="18" height="14" rx="2" ry="2" fill="none" stroke="url(#blueGrad)" stroke-width="2"/>
  <polyline points="5,14 8,10 11,12 14,7 17,9 20,6" 
            fill="none" stroke="url(#blueGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="19" cy="16.5" r="2.5" fill="url(#blueGrad)"/>
</svg>

)

const TutorialsIcon = () => (
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 5C4 4.447 4.447 4 5 4H15C16.105 4 17 4.895 17 6V20C17 20.553 16.553 21 16 21H6C4.895 21 4 20.105 4 19V5Z" 
        stroke="#007BFF" stroke-width="2" fill="none" stroke-linejoin="round"/>
  <path d="M17 6H19C20.105 6 21 6.895 21 8V20C21 20.553 20.553 21 20 21H17" 
        stroke="#007BFF" stroke-width="2" fill="none" stroke-linejoin="round"/>
  <circle cx="10" cy="12" r="3" fill="#007BFF"/>
  <polygon points="9,10.5 12,12 9,13.5" fill="white"/>
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
      <div className="main" style={{ width: "100vw", height: "100vh", minHeight: "100vh", minWidth: "100vw", overflow: "hidden" }}>
        <div className="main__container" style={{ width: "100%", height: "100%", minHeight: "100vh", minWidth: "100vw", overflow: "hidden" }}>
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
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "calc(100vh - 60px)",
                  minWidth: "100vw",
                  boxSizing: "border-box",
                  overflowY: "auto",
                  overflowX: "hidden",
                  background: "#f9fafb",
                  padding: "0",
                  margin: "0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Suspense fallback={<ChunkLoader message={localize("Please wait, loading Dcircles...")} />}>
                  <Analysis />
                </Suspense>
              </div>
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

// --------- SVG ICONS ---------
// All SVG icon components from your original code should be pasted above this AppWrapper component.
// --------------------------------
