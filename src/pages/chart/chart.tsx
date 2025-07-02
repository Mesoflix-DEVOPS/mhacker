import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { useStore } from '@/hooks/useStore';
import {
    ActiveSymbolsRequest,
    ServerTimeRequest,
    TicksHistoryResponse,
    TicksStreamRequest,
    TradingTimesRequest,
} from '@deriv/api-types';
import { ChartTitle, SmartChart } from '@deriv/deriv-charts';
import { useDevice } from '@deriv-com/ui';
import ToolbarWidgets from './toolbar-widgets';
import '@deriv/deriv-charts/dist/smartcharts.css';

type TSubscription = {
    [key: string]: null | {
        unsubscribe?: () => void;
    };
};

type TError = null | {
    error?: {
        code?: string;
        message?: string;
    };
};

const subscriptions: TSubscription = {};

const Chart = observer(({ show_digits_stats }: { show_digits_stats: boolean }) => {
    const barriers: [] = [];
    const { common, ui } = useStore();
    const { chart_store, run_panel, dashboard } = useStore();

    const {
        chart_type,
        getMarketsOrder,
        granularity,
        onSymbolChange,
        setChartStatus,
        symbol,
        updateChartType,
        updateGranularity,
        updateSymbol,
        setChartSubscriptionId,
        chart_subscription_id,
    } = chart_store;
    const chartSubscriptionIdRef = useRef(chart_subscription_id);
    const { isDesktop, isMobile } = useDevice();
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;
    const settings = {
        assetInformation: false, // ui.is_chart_asset_info_visible,
        countdown: true,
        isHighestLowestMarkerEnabled: false, // TODO: Pending UI,
        language: common.current_language.toLowerCase(),
        position: ui.is_chart_layout_default ? 'bottom' : 'left',
        theme: ui.is_dark_mode_on ? 'dark' : 'light',
    };

    // State for toggling between SmartChart and Deriv Trading View
    const [is_trading_view, setIsTradingView] = useState(false);

    // Deriv TradingView Embed URL (static as per your request)
    const derivTradingViewURL = "https://charts.deriv.com/deriv";

    useEffect(() => {
        return () => {
            chart_api.api.forgetAll('ticks');
        };
    }, []);

    useEffect(() => {
        chartSubscriptionIdRef.current = chart_subscription_id;
    }, [chart_subscription_id]);

    useEffect(() => {
        if (!symbol) updateSymbol();
    }, [symbol, updateSymbol]);

    const requestAPI = (req: ServerTimeRequest | ActiveSymbolsRequest | TradingTimesRequest) => {
        return chart_api.api.send(req);
    };
    const requestForgetStream = (subscription_id: string) => {
        subscription_id && chart_api.api.forget(subscription_id);
    };

    const requestSubscribe = async (req: TicksStreamRequest, callback: (data: any) => void) => {
        try {
            requestForgetStream(chartSubscriptionIdRef.current);
            const history = await chart_api.api.send(req);
            setChartSubscriptionId(history?.subscription.id);
            if (history) callback(history);
            if (req.subscribe === 1) {
                subscriptions[history?.subscription.id] = chart_api.api
                    .onMessage()
                    ?.subscribe(({ data }: { data: TicksHistoryResponse }) => {
                        callback(data);
                    });
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            (e as TError)?.error?.code === 'MarketIsClosed' && callback([]); //if market is closed sending a empty array  to resolve
            console.log((e as TError)?.error?.message);
        }
    };

    if (!symbol) return null;
    const is_connection_opened = !!chart_api?.api;
    return (
        <div
            className={classNames('dashboard__chart-wrapper', {
                'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
            })}
            dir='ltr'
        >
            {/* Toggle Button at the top of the chart */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px' }}>
                {is_trading_view ? (
                    <button
                        onClick={() => setIsTradingView(false)}
                        style={{
                            backgroundColor: 'lightblue',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        Charts
                    </button>
                ) : (
                    <button
                        onClick={() => setIsTradingView(true)}
                        style={{
                            backgroundColor: 'lightblue',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        Trading View
                    </button>
                )}
            </div>

            {/* Chart Area */}
            {is_trading_view ? (
                // Deriv Trading View Embedded Widget (iframe)
                <iframe
                    src={derivTradingViewURL}
                    style={{ width: '100%', height: '600px', border: 'none' }}
                    title="Deriv Trading View"
                    allowFullScreen
                />
            ) : (
                // Your existing SmartChart as before
                <SmartChart
                    id='dbot'
                    barriers={barriers}
                    showLastDigitStats={show_digits_stats}
                    chartControlsWidgets={null}
                    enabledChartFooter={false}
                    chartStatusListener={(v: boolean) => setChartStatus(!v)}
                    toolbarWidget={() => (
                        <ToolbarWidgets
                            updateChartType={updateChartType}
                            updateGranularity={updateGranularity}
                            position={!isDesktop ? 'bottom' : 'top'}
                            isDesktop={isDesktop}
                        />
                    )}
                    chartType={chart_type}
                    isMobile={isMobile}
                    enabledNavigationWidget={isDesktop}
                    granularity={granularity}
                    requestAPI={requestAPI}
                    requestForget={() => {}}
                    requestForgetStream={() => {}}
                    requestSubscribe={requestSubscribe}
                    settings={settings}
                    symbol={symbol}
                    topWidgets={() => <ChartTitle onChange={onSymbolChange} />}
                    isConnectionOpened={is_connection_opened}
                    getMarketsOrder={getMarketsOrder}
                    isLive
                    leftMargin={80}
                />
            )}
        </div>
    );
});

export default Chart;
