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

/** NEW REALISTIC ICONS **/

const DashboardIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#1976D2" />
    <rect x="7" y="7" width="4" height="10" rx="1" fill="#fff" />
    <rect x="13" y="7" width="4" height="5" rx="1" fill="#90CAF9" />
    <rect x="13" y="14" width="4" height="3" rx="1" fill="#64B5F6" />
  </svg>
);

const BotBuilderIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="5" y="16" width="14" height="3" rx="1.5" fill="#388E3C"/>
    <rect x="7" y="5" width="10" height="8" rx="2" fill="#A5D6A7"/>
    <circle cx="12" cy="9" r="2" fill="#388E3C"/>
    <rect x="10" y="13" width="4" height="2" rx="1" fill="#fff"/>
  </svg>
);

const ChartsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="4" y="14" width="3" height="6" rx="1" fill="#FFA000" />
    <rect x="10" y="10" width="3" height="10" rx="1" fill="#1976D2" />
    <rect x="16" y="6" width="3" height="14" rx="1" fill="#388E3C" />
    <line x1="3" y1="21" x2="21" y2="21" stroke="#aaa" strokeWidth="1"/>
  </svg>
);

const DCirclesIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" stroke="#7B1FA2" strokeWidth="2" fill="#E1BEE7"/>
    <circle cx="12" cy="12" r="5" stroke="#8BC34A" strokeWidth="2" fill="#C5E1A5"/>
    <circle cx="12" cy="12" r="2" stroke="#FFD600" strokeWidth="2" fill="#FFF9C4"/>
  </svg>
);

const TutorialsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="16" rx="2" fill="#FF7043"/>
    <rect x="6" y="7" width="12" height="2" fill="#fff"/>
    <rect x="6" y="11" width="8" height="2" fill="#fff"/>
    <rect x="6" y="15" width="6" height="2" fill="#fff"/>
  </svg>
);

const CopyTradingIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="4" y="5" width="16" height="7" rx="2" fill="#00ACC1"/>
    <rect x="6" y="13" width="12" height="5" rx="2" fill="#4DD0E1"/>
    <circle cx="8" cy="16" r="1" fill="#fff"/>
    <circle cx="16" cy="16" r="1" fill="#fff"/>
  </svg>
);

const AnalysisToolIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <ellipse cx="12" cy="12" rx="9" ry="7" stroke="#FBC02D" strokeWidth="2" fill="#FFFDE7"/>
    <path d="M6 12h12M12 5v14" stroke="#FBC02D" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2.5" fill="#FBC02D"/>
  </svg>
);

const SignalsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="10" y="4" width="4" height="16" rx="2" fill="#43A047"/>
    <rect x="4" y="10" width="4" height="10" rx="2" fill="#A5D6A7"/>
    <rect x="16" y="13" width="4" height="7" rx="2" fill="#388E3C"/>
  </svg>
);

const TradingHubIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#F06292" />
    <path d="M12 7v5l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="4" fill="#fff" opacity="0.4"/>
  </svg>
);

const FreeBotsIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="5" y="10" width="14" height="8" rx="4" fill="#FFD600"/>
    <ellipse cx="12" cy="14" rx="3" ry="2" fill="#fff"/>
    <rect x="8" y="6" width="8" height="4" rx="2" fill="#FFEE58"/>
    <circle cx="9" cy="12" r="1" fill="#555"/>
    <circle cx="15" cy="12" r="1" fill="#555"/>
  </svg>
);

const RiskIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <polygon points="12,2 22,20 2,20" fill="#D32F2F"/>
    <rect x="11" y="8" width="2" height="6" rx="1" fill="#fff"/>
    <rect x="11" y="16" width="2" height="2" rx="1" fill="#fff"/>
  </svg>
);

const StrategyIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    <rect x="3" y="19" width="18" height="2" rx="1" fill="#0288D1"/>
    <rect x="7" y="5" width="10" height="10" rx="4" fill="#B3E5FC"/>
    <path d="M9 9h6v2H9z" fill="#0288D1"/>
    <circle cx="12" cy="10" r="1.5" fill="#0288D1"/>
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

    const analysisUrl = "https://mesoflix-percentage.netlify.app/";
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
            <Dialog cancel_button_text={cancel_button_text || localize('Cancel')} confirm_button_text={ok_button_text || localize('Ok')} has_close_icon is_visible={is_dialog_open} onCancel={onCancelButtonClick} onConfirm={onOkButtonClick} onClose={onCloseDialog} title={title || ''}>
                {message}
            </Dialog>
        </>
 
