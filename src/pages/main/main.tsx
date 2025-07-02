import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Tabs from '@/components/shared_ui/tabs/tabs';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import { DBOT_TABS, TAB_IDS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

/** NEW REALISTIC ICONS **/

const DashboardIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="10" width="4" height="10" rx="1" fill="#1565C0" />
    <rect x="10" y="4" width="4" height="16" rx="1" fill="#42A5F5" />
    <rect x="17" y="14" width="4" height="6" rx="1" fill="#90CAF9" />
  </svg>
);

const BotBuilderIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <g stroke="#616161" strokeWidth="2" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="3" fill="#FFFDE7"/>
      <path d="M9 10h6M9 14h3" stroke="#616161"/>
      <circle cx="17" cy="7" r="2" fill="#FFA726" />
    </g>
  </svg>
);

const ChartsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <g>
      <rect x="3" y="14" width="2.5" height="7" rx="1.25" fill="#0288D1"/>
      <rect x="8.25" y="6" width="2.5" height="15" rx="1.25" fill="#43A047"/>
      <rect x="13.5" y="1" width="2.5" height="20" rx="1.25" fill="#FFA726"/>
      <rect x="18.75" y="10" width="2.5" height="11" rx="1.25" fill="#8E24AA"/>
    </g>
  </svg>
);

const DCirclesIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#00ACC1" strokeWidth="2" fill="#E0F7FA"/>
    <circle cx="12" cy="12" r="6" stroke="#00897B" strokeWidth="2" fill="#B2DFDB"/>
    <circle cx="12" cy="12" r="3" stroke="#FF7043" strokeWidth="2" fill="#FFCCBC"/>
  </svg>
);

const TutorialsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#FFF3E0" stroke="#FFA726" strokeWidth="2"/>
    <polygon points="10,8 17,12 10,16" fill="#FFA726" />
  </svg>
);

const CopyTradingIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <g>
      <circle cx="7" cy="7" r="3" fill="#43A047"/>
      <circle cx="17" cy="7" r="3" fill="#0288D1"/>
      <rect x="2" y="15" width="8" height="6" rx="2" fill="#B2DFDB"/>
      <rect x="14" y="15" width="8" height="6" rx="2" fill="#BBDEFB"/>
    </g>
  </svg>
);

const AnalysisToolIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#5C6BC0" strokeWidth="2" fill="#E8EAF6"/>
    <path d="M12 12L12 3A9 9 0 0 1 21 12Z" fill="#FFA726"/>
    <path d="M12 12L21 12A9 9 0 0 1 12 21Z" fill="#42A5F5"/>
  </svg>
);

const SignalsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <ellipse cx="12" cy="19" rx="2" ry="2" fill="#43A047" />
    <path d="M12 17V5" stroke="#43A047" strokeWidth="2"/>
    <path d="M7 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#0288D1" strokeWidth="2"/>
  </svg>
);

const TradingHubIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <rect x="5" y="5" width="14" height="14" rx="4" fill="#E0E0E0"/>
    <path d="M12 7v6l4 2" stroke="#FFA726" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const FreeBotsIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <rect x="6" y="10" width="12" height="8" rx="3" fill="#FFFDE7" stroke="#FFA726" strokeWidth="2"/>
    <rect x="10" y="16" width="4" height="3" rx="1" fill="#FFA726"/>
    <circle cx="9" cy="14" r="1" fill="#616161" />
    <circle cx="15" cy="14" r="1" fill="#616161" />
  </svg>
);

const RiskIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M12 3l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V7l8-4z"
      stroke="#B71C1C" strokeWidth="2" fill="#F8BBD0"/>
    <path d="M13 10l-2 4h3l-2 4" stroke="#B71C1C" strokeWidth="2" fill="none"/>
  </svg>
);

const StrategyIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="18" width="18" height="3" rx="1.5" fill="#789262"/>
    <path d="M18 18V8.5c0-3.59-2.91-6.5-6.5-6.5S5 4.91 5 8.5V18"
      stroke="#5C6BC0" strokeWidth="2" fill="none"/>
    <circle cx="15" cy="9" r="1" fill="#FFA726"/>
  </svg>
);

const BotIcon = FreeBotsIcon;

// --- END ICONS ---

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, summary_card } = useStore();
    const {
        active_tab,
        is_chart_modal_visible,
        is_trading_view_modal_visible,
        setActiveTab,
    } = dashboard;
    const { onEntered } = load_modal;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick, stopBot, is_drawer_open } = run_panel;
    const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string };
    const { clear } = summary_card;
    const { isDesktop } = useDevice();

    const [bots, setBots] = useState([]);

    const analysisUrl = "https://api.binarytool.site/";
    const signalGeneratorUrl = "https://your.signal.generator.url";
    const dcirclesUrl = "https://nilotetrader.netlify.app/";
    const riskUrl = "https://example.com/risk";
    const strategyUrl = "https://example.com/strategy";

    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
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
                'Massive-recovery-by-Pipshark.xml',
                'Master Bot V6 CEO Gatimu.xml',
                'Piprhino-even-odd-speedmax.xml',
                'H_L auto vault.xml',
                'Expert_Speed_Bot_By_CHOSEN_DOLLAR_PRINTER_FX📉📉📉📈📈📈_1_1.xml',
            ];
            const botPromises = botFiles.map(async (file) => {
                try {
                    const response = await fetch(file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
                    }
                    const text = await response.text();
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, 'application/xml');
                    return {
                        title: file.split('/').pop(),
                        image: xml.getElementsByTagName('image')[0]?.textContent || 'default_image_path',
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

    const handleTabChange = React.useCallback(
        (tab_index: number) => {
            setActiveTab(tab_index);
        },
        [setActiveTab]
    );

    const handleBotClick = useCallback(async (bot: { filePath: string; xmlContent: string }) => {
        setActiveTab(DBOT_TABS.BOT_BUILDER);
        try {
            if (typeof load_modal.loadFileFromContent === 'function') {
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
    }, [setActiveTab, load_modal, updateWorkspaceName]);

    const handleOpen = useCallback(async () => {
        await load_modal.loadFileFromRecent();
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    }, [load_modal, setActiveTab]);

    const showRunPanel = [1, 2, 3, 4].includes(active_tab);

    // Font and menu tab adjustments
    const tabLabelStyle = {
        fontSize: '15px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '7px'
    };

    return (
        <React.Fragment>
            <div className='main'>
                <div className='main__container' style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
                    <Tabs active_index={active_tab} className='main__tabs'
                        onTabItemChange={onEntered}
                        onTabItemClick={handleTabChange}
                        top
                        tab_item_style={tabLabelStyle}
                    >
                        <div label={<span style={tabLabelStyle}><DashboardIcon /><Localize i18n_default_text='Dashboard' /></span>} id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                            <button onClick={handleOpen}>Load Bot</button>
                        </div>
                        <div label={<span style={tabLabelStyle}><BotBuilderIcon /><Localize i18n_default_text='Bot Builder' /></span>} id='id-bot-builder' />
                        <div label={<span style={tabLabelStyle}><ChartsIcon /><Localize i18n_default_text='Charts' /></span>} id='id-charts'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        <div label={<span style={tabLabelStyle}><DCirclesIcon /><Localize i18n_default_text='Dcircles' /></span>} id='id-dcircles'>
                            <div style={{ width: '100%', height: 600 }}>
                                <iframe
                                    src={dcirclesUrl}
                                    width="100%"
                                    height="100%"
                                    title="Dcircles"
                                    style={{ border: 'none', display: 'block', borderRadius: 16, background: '#f0f4fa' }}
                                    scrolling="yes"
                                />
                            </div>
                        </div>
                        <div label={<span style={tabLabelStyle}><TutorialsIcon /><Localize i18n_default_text='Tutorials' /></span>} id='id-tutorials'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}>
                                <Tutorial handleTabChange={handleTabChange} />
                            </Suspense>
                        </div>
                        <div label={<span style={tabLabelStyle}><CopyTradingIcon /><Localize i18n_default_text='Copytrading' /></span>} id='id-copytrading'>
                            <div style={{ padding: 32, textAlign: 'center', fontSize: 20, color: '#A259FF' }}>
                                Part under development
                            </div>
                        </div>
                        <div label={<span style={tabLabelStyle}><AnalysisToolIcon /><Localize i18n_default_text='Analysis' /></span>} id='id-analysis'>
                            <div style={{ width: '100%', height: 600 }}>
                                <iframe
                                    src={analysisUrl}
                                    width="100%"
                                    height="100%"
                                    title="Analysis"
                                    style={{ border: 'none', display: 'block' }}
                                    scrolling="yes"
                                />
                            </div>
                        </div>
                        <div label={<span style={tabLabelStyle}><SignalsIcon /><Localize i18n_default_text='Signals' /></span>} id='id-signals'>
                            <div className={classNames('dashboard__chart-wrapper', {
                                'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                                'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                            })}>
                                <iframe
                                    src='signals'
                                    width="100%"
                                    height="600px"
                                    style={{ border: 'none', display: 'block' }}
                                    scrolling="yes"
                                />
                            </div>
                        </div>
                        <div label={<span style={tabLabelStyle}><TradingHubIcon /><Localize i18n_default_text='Signal Generator' /></span>} id='id-Trading-Hub'>
                            <div style={{ width: '100%', height: 750 }}>
                                <iframe
                                    src={signalGeneratorUrl}
                                    width="100%"
                                    height="100%"
                                    title="Signal Generator"
                                    style={{ border: 'none', display: 'block' }}
                                    scrolling="yes"
                                />
                            </div>
                        </div>
                        {/* FREE BOTS MODERNIZED */}
                        <div label={<span style={tabLabelStyle}><FreeBotsIcon /><Localize i18n_default_text='Free Bots' /></span>} id='id-free-bots'>
                            <div style={{
                                minHeight: 700,
                                background: '#f6f6f6',
                                padding: '36px 0'
                            }}>
                                <h2 style={{
                                    textAlign: 'center',
                                    color: '#232323',
                                    fontWeight: 700,
                                    fontSize: 28,
                                    marginBottom: 30
                                }}>
                                    <Localize i18n_default_text='Free Bots' />
                                </h2>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    gap: 32
                                }}>
                                    {bots.map((bot, index) => (
                                        <div key={index} style={{
                                            background: '#fffdfa',
                                            borderRadius: 15,
                                            boxShadow: '0 2px 18px 0 #efefef',
                                            padding: '24px 24px 20px 24px',
                                            minWidth: 220,
                                            maxWidth: 270,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            margin: 0
                                        }}>
                                            <BotIcon />
                                            <div style={{
                                                fontSize: 17,
                                                fontWeight: 700,
                                                color: '#2a2121',
                                                margin: '14px 0 18px 0',
                                                textAlign: 'center',
                                                letterSpacing: '0.5px'
                                            }}>{bot.title}</div>
                                            <button
                                                onClick={() => handleBotClick(bot)}
                                                style={{
                                                    marginTop: 10,
                                                    padding: '9px 22px',
                                                    fontSize: 15,
                                                    background: '#FFA726',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: 25,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = '#FB8C00'}
                                                onMouseOut={e => e.currentTarget.style.background = '#FFA726'}
                                            >
                                                Load
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Risk as iframe tab */}
                        <div label={<span style={tabLabelStyle}><RiskIcon /><Localize i18n_default_text='Risk' /></span>} id='id-risk'>
                            <div style={{ width: '100%', height: 600 }}>
                                <iframe
                                    src={riskUrl}
                                    width="100%"
                                    height="100%"
                                    title="Risk"
                                    style={{ border: 'none', display: 'block', borderRadius: 16, background: '#fff7fa' }}
                                    scrolling="yes"
                                />
                            </div>
                        </div>
                        {/* Strategy as iframe tab */}
                        <div label={<span style={tabLabelStyle}><StrategyIcon /><Localize i18n_default_text='Strategy' /></span>} id='id-strategy'>
       
