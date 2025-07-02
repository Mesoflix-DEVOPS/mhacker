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

// Updated colored icons
const DashboardIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="8" height="10" fill="#4F8CFF" />
        <rect x="3" y="17" width="8" height="4" fill="#A5DC86" />
        <rect x="13" y="11" width="8" height="10" fill="#FFB84F" />
        <rect x="13" y="3" width="8" height="6" fill="#FF4F81" />
    </svg>
);

const BotBuilderIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#A259FF" />
        <rect x="10" y="8" width="4" height="8" fill="#FFF" />
        <circle cx="12" cy="7" r="1.5" fill="#FFB84F" />
    </svg>
);

const ChartsIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="4" y="12" width="3" height="8" fill="#FF4F81" />
        <rect x="10" y="9" width="3" height="11" fill="#4F8CFF" />
        <rect x="16" y="5" width="3" height="15" fill="#A5DC86" />
    </svg>
);

const TutorialsIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <ellipse cx="12" cy="12" rx="10" ry="7" fill="#FFD700" />
        <rect x="6" y="10" width="12" height="5" fill="#FFF" />
        <circle cx="12" cy="12.5" r="1.5" fill="#4F8CFF" />
    </svg>
);

const AnalysisToolIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="16" width="4" height="5" fill="#A5DC86" />
        <rect x="9" y="10" width="4" height="11" fill="#FF4F81" />
        <rect x="15" y="6" width="4" height="15" fill="#4F8CFF" />
        <circle cx="7" cy="15" r="1" fill="#FFD700" />
    </svg>
);

const SignalsIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="5" y="5" width="3" height="14" fill="#FF4F81" />
        <rect x="10" y="10" width="3" height="9" fill="#4F8CFF" />
        <rect x="15" y="15" width="3" height="4" fill="#A5DC86" />
    </svg>
);

const TradingHubIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#A5DC86" />
        <rect x="7" y="7" width="10" height="10" fill="#FFD700" />
    </svg>
);

const FreeBotsIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle cx="8" cy="8" r="4" fill="#4F8CFF" />
        <circle cx="16" cy="16" r="4" fill="#FF4F81" />
        <rect x="10" y="10" width="4" height="4" fill="#A259FF" />
    </svg>
);

const CopyTradingIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#FFD700" />
        <path d="M8 12h8M12 8v8" stroke="#4F8CFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const MoreIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <circle cx="6" cy="12" r="2" fill="#A5DC86" />
        <circle cx="12" cy="12" r="2" fill="#4F8CFF" />
        <circle cx="18" cy="12" r="2" fill="#FF4F81" />
    </svg>
);

const BotIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#A259FF" />
        <rect x="10" y="8" width="4" height="8" fill="#FFF" />
        <circle cx="12" cy="7" r="1.5" fill="#FFB84F" />
    </svg>
);

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
    const { DASHBOARD, BOT_BUILDER, ANALYSIS_TOOL, SIGNALS } = DBOT_TABS;
    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();

    const [bots, setBots] = useState([]);
    const [analysisToolUrl, setAnalysisToolUrl] = useState('ai');
    const isAnalysisToolActive = active_tab === ANALYSIS_TOOL;

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

    const runBot = (xmlContent: string) => {
        updateWorkspaceName(xmlContent);
        console.log('Running bot with content:', xmlContent);
    };

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

    const toggleAnalysisTool = (url: string) => {
        setAnalysisToolUrl(url);
    };

    const showRunPanel = [DBOT_TABS.BOT_BUILDER, DBOT_TABS.CHART, DBOT_TABS.ANALYSIS_TOOL, DBOT_TABS.SIGNALS].includes(active_tab);

    // Remove extra spaces at top and sides using a custom style on main__container
    return (
        <React.Fragment>
            <div className='main'>
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
                        <div label={<><TutorialsIcon /><Localize i18n_default_text='Tutorials' /></>} id='id-tutorials'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}>
                                <Tutorial handleTabChange={handleTabChange} />
                            </Suspense>
                        </div>
                        {/* New Copytrading Tab */}
                        <div label={<><CopyTradingIcon /><Localize i18n_default_text='Copytrading' /></>} id='id-copytrading'>
                            <div style={{ padding: 32, textAlign: 'center', fontSize: 20, color: '#A259FF' }}>
                                Part under development
                            </div>
                        </div>
                        {/* New Analysis Tab */}
                        <div label={<><AnalysisToolIcon /><Localize i18n_default_text='Analysis' /></>} id='id-analysis'>
                            <div style={{ padding: 32, textAlign: 'center', fontSize: 20, color: '#4F8CFF' }}>
                                Analysis section (customize as needed)
                            </div>
                        </div>
                        {/* New More Tab */}
                        <div label={<><MoreIcon /><Localize i18n_default_text='More' /></>} id='id-more'>
                            <div style={{ padding: 32, textAlign: 'center', fontSize: 20, color: '#FF4F81' }}>
                                More features coming soon!
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
                            <div className={classNames('dashboard__chart-wrapper', {
                                'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                                'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                            })}>
                                <iframe src='https://mekop.netlify.app' height='750px' frameBorder='0' />
                            </div>
                        </div>
                        <div label={<><FreeBotsIcon /><Localize i18n_default_text='Free Bots' /></>} id='id-free-bots'>
                            <div className='free-bots'>
                                <h2 className='free-bots__heading'><Localize i18n_default_text='Free Bots' /></h2>
                                <div className='free-bots__content-wrapper'>
                                    <ul className='free-bots__content'>
                                        {bots.map((bot, index) => (
                                            <li className='free-bot' key={index} onClick={() => {
                                                handleBotClick(bot);
                                            }}>
                                                <BotIcon />
                                                <div className='free-bot__details'>
                                                    <h3 className='free-bot__title'>{bot.title}</h3>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
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
        </React.Fragment>
    );
});

export default AppWrapper;
