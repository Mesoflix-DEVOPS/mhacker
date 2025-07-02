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
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
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

/** ICONS **/

const DashboardIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path d="M3 12L12 5l9 7v7a2 2 0 01-2 2h-3a1 1 0 01-1-1v-3H9v3a1 1 0 01-1 1H5a2 2 0 01-2-2v-7z"
      stroke="#4F8CFF" strokeWidth="2" strokeLinejoin="round" fill="none" />
  </svg>
);

const BotBuilderIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a3 3 0 104.242 4.242l-1.414-1.414-4.242 4.242 1.414 1.414a3 3 0 10-4.242-4.242l4.242-4.242z"
      stroke="#A259FF" strokeWidth="2" strokeLinejoin="round" fill="none" />
    <circle cx="7" cy="17" r="3" stroke="#A259FF" strokeWidth="2" fill="none" />
    <path d="M7 20v2m0-2a3 3 0 003-3H4a3 3 0 003 3z" stroke="#A259FF" strokeWidth="2" fill="none" />
  </svg>
);

const ChartsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="10" width="4" height="10" rx="1" fill="#4F8CFF" />
    <rect x="10" y="6" width="4" height="14" rx="1" fill="#FFB84F" />
    <rect x="17" y="2" width="4" height="18" rx="1" fill="#A5DC86" />
  </svg>
);

const DCirclesIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke="#4F8CFF" strokeWidth="2" fill="#F0F8FF"/>
    <circle cx="12" cy="12" r="6" stroke="#A259FF" strokeWidth="2" fill="#E0E7FF"/>
    <circle cx="12" cy="12" r="3" stroke="#FFD700" strokeWidth="2" fill="#FFF7E0"/>
    <circle cx="12" cy="12" r="1" fill="#FF4F81" />
  </svg>
);

const TutorialsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#FFD700" strokeWidth="2" fill="none" />
    <polygon points="10,8 17,12 10,16" fill="#FFD700" />
  </svg>
);

const CopyTradingIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path d="M7 17a4 4 0 110-8 4 4 0 010 8zm10 0a4 4 0 110-8 4 4 0 010 8z" stroke="#FF4F81" strokeWidth="2" />
    <path d="M7 13h10" stroke="#FF4F81" strokeWidth="2" />
  </svg>
);

const AnalysisToolIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="#4F8CFF" strokeWidth="2" fill="none" />
    <path d="M12 2a10 10 0 0110 10h-10z" fill="#4F8CFF" />
    <path d="M12 12v10A10 10 0 012 12h10z" fill="#FFD700" />
  </svg>
);

const SignalsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="18" r="2" fill="#A5DC86" />
    <path d="M12 16v-4" stroke="#A5DC86" strokeWidth="2" />
    <path d="M8.5 15.5a6 6 0 117 0" stroke="#A5DC86" strokeWidth="2" fill="none" />
  </svg>
);

const TradingHubIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <polygon points="13 2 3 14 11 14 11 22 21 10 13 10 13 2"
      fill="#FF4F81" stroke="#FF4F81" strokeWidth="2" />
  </svg>
);

const FreeBotsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="6" y="8" width="12" height="8" rx="2" fill="#A259FF" />
    <rect x="9" y="16" width="6" height="3" rx="1" fill="#FFD700" />
    <circle cx="9" cy="12" r="1" fill="#FFF" />
    <circle cx="15" cy="12" r="1" fill="#FFF" />
  </svg>
);

const RiskIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path d="M12 3l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V7l8-4z"
      stroke="#FF4F81" strokeWidth="2" fill="#FFF0F3"/>
    <path d="M13 10l-2 4h3l-2 4" stroke="#FF4F81" strokeWidth="2" fill="none"/>
  </svg>
);

const StrategyIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="18" width="18" height="3" rx="1.5" fill="#A5DC86"/>
    <path d="M18 18V8.5c0-3.59-2.91-6.5-6.5-6.5S5 4.91 5 8.5V18"
      stroke="#A259FF" strokeWidth="2" fill="none"/>
    <path d="M8 13c1-1 3-1 4 1s3-1 3-2.5c0-.92-1.5-2.5-4-2.5S7 11.08 7 12c0 1.5 2 3.5 4 3.5" 
      stroke="#FFD700" strokeWidth="2" fill="none"/>
    <circle cx="15" cy="9" r="1" fill="#FFD700"/>
  </svg>
);

const BotIcon = FreeBotsIcon;

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, quick_strategy, summary_card } = useStore();
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

    const analysisUrl = "https://your.analysis.tool.url";
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

    // Inline styles for new requirements
    const mainLightBg = {
        background: '#f7f7fa',
        minHeight: '100vh',
    };
    const freeBotCard = {
        background: '#fffbe6',
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        padding: '18px 20px',
        marginBottom: 18,
        transition: 'box-shadow 0.2s',
    };
    const botIcon = {
        marginRight: 16,
        display: 'flex',
        alignItems: 'center',
    };
    const botDetails = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-start',
    };
    const botTitle = {
        color: '#002F6C',
        fontSize: '1.15rem',
        fontWeight: 700,
        marginBottom: 10,
        wordBreak: 'break-word' as const,
    };
    const loadBtn = {
        background: '#FFB84F',
        color: '#fff',
        fontWeight: 'bold' as const,
        border: 'none',
        borderRadius: 6,
        padding: '7px 18px',
        fontSize: '0.98rem',
        cursor: 'pointer',
        transition: 'background 0.2s',
        marginTop: 2,
    };

    return (
        <>
            <div className='main' style={mainLightBg}>
                <div className='main__container' style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
                    <Tabs active_index={active_tab} className='main__tabs' onTabItemChange={onEntered} onTabItemClick={handleTabChange} top>
                        <div label={<><DashboardIcon /><Localize i18n_default_text='Dashboard' /></>} id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                            <button onClick={handleOpen}>Load Bot</button>
                        </div>
                        <div label={<><BotBuilderIcon /><Localize i18n_default_text='Bot Builder' /></>} id='id-bot-builder' />
                        <div label={<><ChartsIcon /><Localize i18n_default_text='Charts' /></>} id='id-charts'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        <div label={<><DCirclesIcon /><Localize i18n_default_text='Dcircles' /></>} id='id-dcircles'>
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
                        <div label={<><TutorialsIcon /><Localize i18n_default_text='Tutorials' /></>} id='id-tutorials'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}>
                                <Tutorial handleTabChange={handleTabChange} />
                            </Suspense>
                        </div>
                        <div label={<><CopyTradingIcon /><Localize i18n_default_text='Copytrading' /></>} id='id-copytrading'>
                            <div style={{ padding: 32, textAlign: 'center', fontSize: 20, color: '#A259FF' }}>
                                Part under development
                            </div>
                        </div>
                        <div label={<><AnalysisToolIcon /><Localize i18n_default_text='Analysis' /></>} id='id-analysis'>
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
                        <div label={<><SignalsIcon /><Localize i18n_default_text='Signals' /></>} id='id-signals'>
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
                        <div label={<><TradingHubIcon /><Localize i18n_default_text='Signal Generator' /></>} id='id-Trading-Hub'>
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
                        <div label={<><FreeBotsIcon /><Localize i18n_default_text='Free Bots' /></>} id='id-free-bots'>
                            <div className='free-bots'>
                                <h2 className='free-bots__heading'><Localize i18n_default_text='Free Bots' /></h2>
                                <div className='free-bots__content-wrapper'>
                                    <ul className='free-bots__content' style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {bots.map((bot, index) => (
                                            <li style={freeBotCard} key={index}>
                                                <div style={botIcon}>
                                                    <BotIcon />
                                                </div>
                                                <div style={botDetails}>
                                                    <h3 style={botTitle}>{bot.title}</h3>
                                                    <button
                                                        style={loadBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBotClick(bot);
                                                        }}
                                                        onMouseOver={e => (e.currentTarget.style.background = '#FFA500')}
                                                        onMouseOut={e => (e.currentTarget.style.background = '#FFB84F')}
                                                    >
                                                        Load Bot
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div label={<><RiskIcon /><Localize i18n_default_text='Risk' /></>} id='id-risk'>
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
                        <div label={<><StrategyIcon /><Localize i18n_default_text='Strategy' /></>} id='id-strategy'>
                            <div style={{ width: '100%', height: 600 }}>
                                <iframe
                                    src={strategyUrl}
                                    width="100%"
                                    height="100%"
                                    title="Strategy"
                                    style={{ border: 'none', display: 'block', borderRadius: 16, background: '#f8f7ff' }}
                                    scrolling="yes"
                                />
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
            <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    {showRunPanel && <RunPanel />}
                </div>
                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>
            <MobileWrapper>
                <RunPanel />
            </MobileWrapper>
            <Dialog cancel_button_text={cancel_button_text || localize('Cancel')} confirm_button_text={ok_button_text || localize('Ok')} has_close_icon is_visible={is_dialog_open} onCancel={onCancelButtonClick} onClose={onCloseDialog} onConfirm={onOkButtonClick || onCloseDialog} title={title}>
                {message}
            </Dialog>
        </>
    );
});

export default AppWrapper;
