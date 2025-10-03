import React, { useEffect, useState, useRef } from 'react';
import { BsExclamationCircle } from 'react-icons/bs';
import ApolloLineChart from './components/line_chart';
import MyResponsivePie from './components/pie_chart';
import OverUnderBarChart from './components/ou_bar_chart';
import { observer, useStore } from '@deriv/stores';
import DiffersBalls from './components/differs_balls';
import { api_base4, api_base, getToken, getLiveAccToken } from '@deriv/bot-skeleton';
import { IoSyncCircleOutline } from 'react-icons/io5';
import { MdOutlineSettings } from 'react-icons/md';
import RiseFallBarChart from './components/rf_bar_chart';
import { useDBotStore } from 'Stores/useDBotStore';
import './analysis.css';
import BotSettings from './components/bot_settings';

function sleep(milliseconds: any) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

type LineChartProps = {
    name: string;
    value: number;
};

type DigitDiffStatsProp = {
    value: number;
    appearence: number;
};

type SymbolData = {
    allow_forward_starting: number;
    display_name: string;
    display_order: number;
    exchange_is_open: number;
    is_trading_suspended: number;
    market: string;
    market_display_name: string;
    pip: number;
    subgroup: string;
    subgroup_display_name: string;
    submarket: string;
    submarket_display_name: string;
    symbol: string;
    symbol_type: string;
};

type ActiveSymbolTypes = {
    active_symbols: SymbolData[];
};

const ApolloAnalysisPage = observer(() => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [currentTick, setCurrentTick] = useState<number | String>('Loading...');
    const [allLastDigitList, setAllLastDigitList] = useState<number[]>([]);
    const [isTickChart, setIsTickChart] = useState(true);
    const [lastDigit, setLastDigit] = useState(0);
    const [numberOfTicks, setNumberOfTicks] = useState<string | number>(50);
    const [optionsList, setOptions] = useState<SymbolData[]>([]);
    const [overValue, setOverValue] = useState<string | number>(4);
    const [martingaleValue, setMartingaleValue] = useState<string | number>(1.2);
    const [percentageValue, setPercentageValue] = useState<string | number>(60);
    const [underValue, setUnderValue] = useState<string | number>(4);
    const [isOneClickActive, setIsOneClickActive] = useState(false);
    const [isAutoClickerActive, setIsAutoClickerActive] = useState(false);
    const [isRiseFallOneClickActive, setIsRiseFallOneClickActive] = useState(false);
    const [isEvenOddOneClickActive, setIsEvenOddOneClickActive] = useState(false);
    const [isOverUnderOneClickActive, setIsOverUnderOneClickActive] = useState(false);
    const [isTradeActive, setIsTradeActive] = useState(false);
    const [oneClickContract, setOneClickContract] = useState('DIGITDIFF');
    const [tradingDiffType, setTradingDiffType] = useState('AUTO');
    const [overUnderContract, setOverUnderContract] = useState('DIGITOVER');
    const [overUnderDirection, setOverUnderDirection] = useState('SAME');
    const [evenOddContract, setEvenOddContract] = useState('DIGITEVEN');
    const [oneClickDuration, setOneClickDuration] = useState(1);
    const [oneClickAmount, setOneClickAmount] = useState<number | string>(0.5);
    const [customPrediction, setCustomPrediction] = useState<number | string>(0);
    const [accountCurrency, setAccountCurrency] = useState('');
    const [active_symbol, setActiveSymbol] = useState('R_100');
    const [prev_symbol, setPrevSymbol] = useState('R_100');
    const [pip_size, setPipSize] = useState(2);
    const [prevLowestValue, setPrevLowestValue] = useState<string | number>('');
    const [showBotSettings, setShowBotSettings] = useState<boolean>(false);
    const [takeProfitValue, setTakeProfitValue] = useState<string | number>(2);
    const [stopLossValue, setStopLossValue] = useState<string | number>(2);
    const [enableSlTpValue, setEnableSlTpValue] = useState<boolean>(false);
    const [enableCopyDemo, setCopyDemo] = useState<boolean>(false);
    const [liveAccCR, setLiveAccCr] = useState<string>('');
    const [overUnderManual, setOverUnderManual] = useState<boolean>(false);

    // Refs
    const martingaleValueRef = useRef(martingaleValue);
    const isTradeActiveRef = useRef(isTradeActive);
    const current_contractids = useRef<string[]>([]);
    const totalLostAmount = useRef(0);
    const oneClickDefaultAmount = useRef<string | number>(0.5);
    const contractTradeTypes = useRef<string[]>(['DIGITODD', 'DIGITEVEN', 'DIGITOVER', 'DIGITUNDER', 'DIGITDIFF']);
    const digitDiffHigh = useRef<DigitDiffStatsProp>({ appearence: 0, value: 0 });
    const digitDiffLow = useRef<DigitDiffStatsProp>({ appearence: 0, value: 0 });
    const take_profit = useRef<number>(2);
    const stop_loss = useRef<number>(2);
    const total_profit = useRef<number>(0);
    const enable_tp_sl = useRef<boolean>(false);
    const enable_demo_copy = useRef<boolean>(false);

    const { ui } = useStore();
    const DBotStores = useDBotStore();
    const { transactions } = DBotStores;

    const { is_mobile } = ui;
    const { updateResultsCompletedContract } = transactions;

    useEffect(() => {
        startApi();
    }, []);

    useEffect(() => {
        if (prev_symbol !== active_symbol) {
            api_base4.api.send({
                ticks_history: active_symbol,
                adjust_start_time: 1,
                count: 5000,
                end: 'latest',
                start: 1,
                style: 'ticks',
            });
        }
        setPrevSymbol(active_symbol);
    }, [active_symbol]);

    const getLastDigits = (tick: any, pip_size: any) => {
        let lastDigit = tick.toFixed(pip_size);
        lastDigit = String(lastDigit).slice(-1);
        return Number(lastDigit);
    };

    const startApi = async () => {
        await sleep(5000);
        if (!isSubscribed) {
            api_base4.api.send({
                active_symbols: 'brief',
                product_type: 'basic',
            });
            setIsSubscribed(true);
        }

        if (api_base4.api) {
            const subscription = api_base4.api.onMessage().subscribe(({ data }: { data: any }) => {
                if (data.msg_type === 'tick') {
                    const { tick } = data;
                    const { ask, id, pip_size } = tick;
                    const last_digit = getLastDigits(ask, pip_size);

                    setLastDigit(last_digit);
                    setCurrentTick(ask);
                    removeFirstElement();
                    setAllLastDigitList(prevList => [...prevList, ask]);
                }

                if (data.msg_type === 'history') {
                    const { history, pip_size } = data;
                    setPipSize(pip_size);
                    const { prices } = history;
                    const { ticks_history } = data.echo_req;
                    setAllLastDigitList(prices);
                    setActiveSymbol(ticks_history);
                    api_base4.api.send({
                        ticks: ticks_history,
                        subscribe: 1,
                    });
                }

                if (data.msg_type === 'active_symbols') {
                    const { active_symbols }: ActiveSymbolTypes = data;
                    const filteredSymbols = active_symbols.filter(symbol => symbol.subgroup === 'synthetics');
                    filteredSymbols.sort((a, b) => a.display_order - b.display_order);
                    api_base4.api.send({
                        ticks_history: filteredSymbols[0].symbol,
                        adjust_start_time: 1,
                        count: 5000,
                        end: 'latest',
                        start: 1,
                        style: 'ticks',
                    });
                    setOptions(filteredSymbols);
                }
            });

            api_base4.pushSubscription(subscription);
        }

        if (api_base.api) {
            const subscription = api_base.api.onMessage().subscribe(({ data }: { data: any }) => {
                if (data.msg_type === 'proposal_open_contract') {
                    const { proposal_open_contract } = data;
                    const contract = proposal_open_contract.contract_type;

                    if (contractTradeTypes.current.includes(contract)) {
                        if (proposal_open_contract.is_sold) {
                            // Take profit and stopLoss check
                            if (
                                !current_contractids.current.includes(proposal_open_contract.contract_id) &&
                                enable_tp_sl.current
                            ) {
                                total_profit.current += proposal_open_contract.profit;
                                if (total_profit.current >= take_profit.current) {
                                    stopAnalysisBot();
                                } else if (total_profit.current <= -stop_loss.current) {
                                    stopAnalysisBot();
                                }
                            }

                            if (proposal_open_contract.status === 'lost') {
                                if (!current_contractids.current.includes(proposal_open_contract.contract_id)) {
                                    totalLostAmount.current += Math.abs(proposal_open_contract.profit);
                                    let newStake;
                                    if (contract === 'DIGITDIFF') {
                                        newStake = totalLostAmount.current * 12.5;
                                    } else {
                                        newStake = totalLostAmount.current * parseFloat(martingaleValueRef.current);
                                    }
                                    setOneClickAmount(parseFloat(newStake.toFixed(2)));
                                }
                            } else {
                                totalLostAmount.current = 0;
                                setOneClickAmount(oneClickDefaultAmount.current);
                            }
                            if (
                                isTradeActiveRef.current &&
                                !current_contractids.current.includes(proposal_open_contract.contract_id)
                            ) {
                                isTradeActiveRef.current = false;
                                setIsTradeActive(false);
                                current_contractids.current.push(proposal_open_contract.contract_id);
                            }
                        }
                    }
                    updateResultsCompletedContract(proposal_open_contract);
                }
            });

            api_base.pushSubscription(subscription);
        }
        setAccountCurrency(api_base.account_info.currency);
    };

    const stopAnalysisBot = () => {
        setIsRiseFallOneClickActive(false);
        setIsOverUnderOneClickActive(false);
        setIsEvenOddOneClickActive(false);
        setIsOneClickActive(false);
        totalLostAmount.current = 0;
        total_profit.current = 0;
        setOneClickAmount(oneClickDefaultAmount.current);
    };

    const selectTickList = () => {
        return (
            <>
                <select name='intervals' id='contract_duration' onChange={handleDurationSelect}>
                    <option value='1'>1</option>
                    <option value='2'>2</option>
                    <option value='3'>3</option>
                    <option value='4'>4</option>
                    <option value='5'>5</option>
                    <option value='6'>6</option>
                    <option value='7'>7</option>
                    <option value='8'>8</option>
                    <option value='9'>9</option>
                </select>
                <div className='oneclick_amout'>
                    <input type='number' value={oneClickAmount} onChange={handleOneClickAmountInputChange} />
                    <h3 className='user_currency'>{accountCurrency}</h3>
                </div>
            </>
        );
    };

    const getOverUnderValue = () => {
        if (overUnderContract === 'DIGITOVER') {
            return overValue;
        } else if (overUnderContract === 'DIGITUNDER') {
            return underValue;
        }
    };

    const buy_contract = (contract_type: string, isTradeActive: boolean) => {
        if (isTradeActive) {
            !enableCopyDemo
                ? api_base.api.send({
                      buy: '1',
                      price: oneClickAmount,
                      subscribe: 1,
                      parameters: {
                          amount: oneClickAmount,
                          basis: 'stake',
                          contract_type,
                          currency: accountCurrency,
                          duration: oneClickDuration,
                          duration_unit: 't',
                          symbol: active_symbol,
                      },
                  })
                : api_base.api.send({
                      buy_contract_for_multiple_accounts: '1',
                      tokens: [getToken().token, getLiveAccToken(liveAccCR).token],
                      price: oneClickAmount,
                      parameters: {
                          amount: oneClickAmount,
                          basis: 'stake',
                          contract_type,
                          currency: accountCurrency,
                          duration: oneClickDuration,
                          duration_unit: 't',
                          symbol: active_symbol,
                      },
                  });
        }
    };

    const buy_contract_differs = (contract_type: string, isOverUnder = false) => {
        !enableCopyDemo
            ? api_base.api.send({
                  buy: '1',
                  price: oneClickAmount,
                  subscribe: 1,
                  parameters: {
                      amount: oneClickAmount,
                      basis: 'stake',
                      contract_type,
                      currency: 'USD',
                      duration: oneClickDuration,
                      duration_unit: 't',
                      symbol: active_symbol,
                      barrier: isOverUnder ? getOverUnderValue() : customPrediction,
                  },
              })
            : api_base.api.send({
                  buy_contract_for_multiple_accounts: '1',
                  tokens: [getToken().token, getLiveAccToken(liveAccCR).token],
                  price: oneClickAmount,
                  parameters: {
                      amount: oneClickAmount,
                      basis: 'stake',
                      contract_type,
                      currency: accountCurrency,
                      duration: oneClickDuration,
                      duration_unit: 't',
                      symbol: active_symbol,
                      barrier: isOverUnder ? getOverUnderValue() : customPrediction,
                  },
              });
    };

    // =========================
    const removeFirstElement = () => {
        setAllLastDigitList(prevList => prevList.slice(1));
    };

    const getLastDigitList = () => {
        const requiredItems = allLastDigitList.slice(-numberOfTicks);
        const returnedList: number[] = [];
        requiredItems.forEach((tick: number) => {
            const last_digit = getLastDigits(tick, pip_size);
            returnedList.push(last_digit);
        });

        return returnedList;
    };

    const getLineChartList = () => {
        const requiredItems = allLastDigitList.slice(-numberOfTicks);
        const returnedList: LineChartProps[] = [];
        let previous_tick = 0;
        let tick_difference = 0;
        requiredItems.forEach((tick: number) => {
            const last_digit = getLastDigits(tick, pip_size);
            if (previous_tick !== 0) {
                tick_difference = tick - previous_tick;
                previous_tick = tick;
            } else {
                previous_tick = tick;
                tick_difference = tick;
            }
            returnedList.push({
                name: isTickChart ? tick.toString() : last_digit.toString(),
                value: isTickChart ? parseFloat(tick_difference.toFixed(2)) : last_digit,
            });
        });

        return returnedList;
    };

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        api_base4.api.forgetAll('ticks').then(() => {
            setCurrentTick('Loading...');
            setActiveSymbol(selectedValue);
        });
    };

    const handleLineChartSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        if (selectedValue === 'risefall') {
            setIsTickChart(true);
        } else if (selectedValue === 'lastdigit') {
            setIsTickChart(false);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setNumberOfTicks(newValue === '' ? '' : Number(newValue));
    };
    const handleOverInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setOverValue(newValue === '' ? '' : Number(newValue));
    };
    const handleMartingaleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        martingaleValueRef.current = newValue === '' ? '' : Number(newValue);
        setMartingaleValue(newValue === '' ? '' : Number(newValue));
    };
    const handlePercentageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setPercentageValue(newValue === '' ? '' : Number(newValue));
    };
    const handleUnderInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setUnderValue(newValue === '' ? '' : Number(newValue));
    };
    const handleOneClickAmountInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setOneClickAmount(newValue === '' ? '' : Number(newValue));
        oneClickDefaultAmount.current = newValue === '' ? '' : Number(newValue);
    };
    const handleCustomPredictionInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setCustomPrediction(newValue === '' ? '' : Number(newValue));
    };

    const handleContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setOneClickContract(selectedValue);
    };

    const handleTradingDiffType = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setTradingDiffType(selectedValue);
    };

    const handleOverUnderContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setOverUnderContract(selectedValue);
    };
    const handleOverUnderDirectionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        if (selectedValue === 'MANUAL') {
            setOverUnderManual(true);
        } else {
            setOverUnderManual(false);
        }
        setOverUnderDirection(selectedValue);
    };
    const handleEvenOddContractSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setEvenOddContract(selectedValue);
    };

    const handleDurationSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setOneClickDuration(Number(selectedValue));
    };

    const handleIsOneClick = () => {
        setIsOneClickActive(!isOneClickActive);
    };
    const handleIsAutoClicker = () => {
        setIsAutoClickerActive(!isAutoClickerActive);
    };

    const handleIsRiseFallOneClick = () => {
        setIsRiseFallOneClickActive(!isRiseFallOneClickActive);
    };
    const handleIsEvenOddOneClick = () => {
        setIsEvenOddOneClickActive(!isEvenOddOneClickActive);
    };
    const handleIsOverUnderOneClick = () => {
        setIsOverUnderOneClickActive(!isOverUnderOneClickActive);
    };

    return (
        <div className='main_app'>
            <div className='top_bar'>
                <div className='symbol_price'>
                    <div className='active_symbol'>
                        <select name='' id='symbol_options' onChange={handleSelectChange}>
                            {optionsList.length > 0 ? (
                                optionsList.map(option => (
                                    <option key={option.symbol} value={option.symbol}>
                                        {option.display_name}
                                    </option>
                                ))
                            ) : (
                                <option value=''>Loading...</option>
                            )}
                        </select>
                    </div>
                    <div className='no_of_ticks'>
                        <input type='number' name='' id='' value={numberOfTicks} onChange={handleInputChange} />
                    </div>
                    <div className='current_price'>
                        <h3>{currentTick.toString()}</h3>
                    </div>
                </div>
                <div className='guide' onClick={() => setShowBotSettings(!showBotSettings)}>
                    <MdOutlineSettings />
                </div>
                {showBotSettings && (
                    <BotSettings
                        enable_tp_sl={enable_tp_sl}
                        setShowBotSettings={setShowBotSettings}
                        showBotSettings={showBotSettings}
                        stop_loss={stop_loss}
                        take_profit={take_profit}
                        setStopLossValue={setStopLossValue}
                        setTakeProfitValue={setTakeProfitValue}
                        stopLossValue={stopLossValue}
                        takeProfitValue={takeProfitValue}
                        enableSlTpValue={enableSlTpValue}
                        setEnableSlTpValue={setEnableSlTpValue}
                        enableCopyDemo={enableCopyDemo}
                        setCopyDemo={setCopyDemo}
                        enable_demo_copy={enable_demo_copy}
                        liveAccCR={liveAccCR}
                        setLiveAccCr={setLiveAccCr}
                    />
                )}
            </div>
            {/* Middle Cards */}
            <div className='rf_ou'>
                <div className='rise_fall card1'>
                    <h2 className='analysis_title'>Rise/Fall</h2>
                    <RiseFallBarChart allDigitList={getLastDigitList()} is_mobile={is_mobile} />
                </div>
                <div className='over_under card1'>
                    <div className='over_under_options'>
                        {/* <h2 className='analysis_title'>Over/Under</h2> */}
                        <div className='digit_inputs'>
                            <div className='over_digit'>
                                <label htmlFor='over_input'>Over</label>
                                <input type='number' value={overValue} onChange={handleOverInputChange} />
                            </div>
                            <div className='under_digit'>
                                <label htmlFor='under_input'>Under</label>
                                <input type='number' value={underValue} onChange={handleUnderInputChange} />
                            </div>
                        </div>
                        <div className='over_oct_container'>
                            <div className='over_oct'>
                                {overUnderManual ? (
                                    <button
                                        onClick={() => buy_contract_differs(overUnderContract, true)}
                                        className='overunder_buy_btn'
                                    >
                                        Buy
                                    </button>
                                ) : (
                                    <input
                                        type='checkbox'
                                        checked={isOverUnderOneClickActive}
                                        onChange={handleIsOverUnderOneClick}
                                    />
                                )}

                                {selectTickList()}
                            </div>
                            <div className='over_under_settings'>
                                <div className='ct_types_ou'>
                                    <select
                                        name='ct_types'
                                        id='contract_types'
                                        onChange={handleOverUnderContractSelect}
                                    >
                                        <option value='DIGITOVER'>Over</option>
                                        <option value='DIGITUNDER'>Under</option>
                                    </select>
                                    <select name='tt_options' id='tt_options' onChange={handleOverUnderDirectionSelect}>
                                        <option value='SAME'>Same</option>
                                        <option value='OPPOSITE'>Opposite</option>
                                        <option value='MANUAL'>Manual</option>
                                    </select>
                                </div>
                                <div className='martingale'>
                                    <small>martingale</small>
                                    <input
                                        type='number'
                                        value={martingaleValueRef.current}
                                        onChange={handleMartingaleInputChange}
                                    />
                                </div>
                                <div className='percentage_value'>
                                    <small>% value</small>
                                    <input
                                        type='number'
                                        value={percentageValue}
                                        onChange={handlePercentageInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <OverUnderBarChart
                        overUnderList={getLastDigitList()}
                        overValue={overValue}
                        underValue={underValue}
                        is_mobile={is_mobile}
                        active_symbol={active_symbol}
                        isOverUnderOneClickActive={isOverUnderOneClickActive}
                        oneClickAmount={oneClickAmount}
                        oneClickDuration={oneClickDuration}
                        isTradeActive={isTradeActive}
                        percentageValue={percentageValue}
                        overUnderContract={overUnderContract}
                        overUnderDirection={overUnderDirection}
                        setIsTradeActive={setIsTradeActive}
                        isTradeActiveRef={isTradeActiveRef}
                        enableCopyDemo={enableCopyDemo}
                        liveAccCR={liveAccCR}
                    />
                </div>
                <div className='line_chart card2'>
                    <div className='linechat_oct'>
                        <select name='' id='linechat_oct_options' onChange={handleLineChartSelectChange}>
                            <option value='risefall'>Rise/Fall Chart</option>
                            <option value='lastdigit'>Last Digits Chart</option>
                        </select>
                        {!isTickChart && <h2 className='analysis_title'>Last Digits Chart</h2>}
                        {isTickChart && (
                            <div className='oct_trading_options'>
                                <div className='details_options'>
                                    <input
                                        type='checkbox'
                                        checked={isRiseFallOneClickActive}
                                        onChange={handleIsRiseFallOneClick}
                                    />
                                    {selectTickList()}
                                </div>
                                <div className='rise_fall_buttons'>
                                    <button
                                        className='rise_btn'
                                        onClick={() => buy_contract('CALL', isRiseFallOneClickActive)}
                                    >
                                        Rise
                                    </button>
                                    <button
                                        className='fall_btn'
                                        onClick={() => buy_contract('PUT', isRiseFallOneClickActive)}
                                    >
                                        Fall
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <ApolloLineChart data={getLineChartList()} />
                </div>
            </div>
            {/* Bottom Cards */}
            <div className='pie_diff'>
                <div className='pie card1'>
                    <div className='odd_even_info'>
                        <h2 className='analysis_title'>Even/Odd</h2>
                        <div className='odd_even_settings'>
                            <input
                                type='checkbox'
                                checked={isEvenOddOneClickActive}
                                onChange={handleIsEvenOddOneClick}
                            />
                            <select name='ct_types' id='contract_types' onChange={handleEvenOddContractSelect}>
                                <option value='DIGITEVEN'>Even</option>
                                <option value='DIGITODD'>Odd</option>
                                <option value='BOTH'>Both</option>
                            </select>
                            <div className='martingale'>
                                <small>martingale</small>
                                <input
                                    type='number'
                                    value={martingaleValueRef.current}
                                    onChange={handleMartingaleInputChange}
                                />
                            </div>
                            <div className='percentage_value'>
                                <small>% value</small>
                                <input type='number' value={percentageValue} onChange={handlePercentageInputChange} />
                            </div>
                        </div>
                        <div className='tick_stake'>{selectTickList()}</div>
                    </div>

                    <div className='pie_container'>
                        <MyResponsivePie
                            allDigitList={getLastDigitList()}
                            contract_type={evenOddContract}
                            isEvenOddOneClickActive={isEvenOddOneClickActive}
                            percentageValue={percentageValue}
                            active_symbol={active_symbol}
                            isTradeActive={isTradeActive}
                            isTradeActiveRef={isTradeActiveRef}
                            oneClickAmount={oneClickAmount}
                            oneClickDuration={oneClickDuration}
                            setIsTradeActive={setIsTradeActive}
                            enableCopyDemo={enableCopyDemo}
                            liveAccCR={liveAccCR}
                        />
                    </div>
                </div>
                <div className='digit_diff card3'>
                    <div className='title_oc_trader'>
                        <h2 className='analysis_title'>Differs/Matches</h2>
                        {tradingDiffType === 'MANUAL' ? (
                            <button className='custom_buy_btn' onClick={() => buy_contract_differs(oneClickContract)}>
                                Buy
                            </button>
                        ) : (
                            oneClickContract === 'DIGITDIFF' && (
                                <div className='auto_clicker'>
                                    <input
                                        type='checkbox'
                                        checked={isAutoClickerActive}
                                        onChange={handleIsAutoClicker}
                                    />
                                    <h4>Auto Clicker</h4>
                                </div>
                            )
                        )}
                        <div className='oneclick_trader'>
                            {tradingDiffType !== 'MANUAL' && (
                                <input type='checkbox' checked={isOneClickActive} onChange={handleIsOneClick} />
                            )}
                            <div className='diff_options'>
                                <select name='ct_types' id='contract_types' onChange={handleContractSelect}>
                                    <option value='DIGITDIFF'>Differs</option>
                                    <option value='DIGITMATCH'>Matches</option>
                                </select>
                                <select name='td_options' id='trading_options' onChange={handleTradingDiffType}>
                                    <option value='AUTO'>Auto</option>
                                    <option value='MANUAL'>Manual</option>
                                </select>
                            </div>
                            {tradingDiffType === 'MANUAL' && (
                                <input
                                    className='custom_prediction'
                                    type='number'
                                    value={customPrediction}
                                    onChange={handleCustomPredictionInputChange}
                                />
                            )}
                            {selectTickList()}
                        </div>
                    </div>
                    <DiffersBalls
                        lastDigitList={getLastDigitList()}
                        active_last={lastDigit}
                        active_symbol={active_symbol}
                        contract_type={oneClickContract}
                        duration={oneClickDuration}
                        isOneClickActive={isOneClickActive}
                        stake_amount={oneClickAmount}
                        prevLowestValue={prevLowestValue}
                        isAutoClickerActive={isAutoClickerActive}
                        digitDiffHigh={digitDiffHigh}
                        digitDiffLow={digitDiffLow}
                        isTradeActive={isTradeActive}
                        isTradeActiveRef={isTradeActiveRef}
                        setIsTradeActive={setIsTradeActive}
                        setPrevLowestValue={setPrevLowestValue}
                        tradingDiffType={tradingDiffType}
                        enableCopyDemo={enableCopyDemo}
                        liveAccCR={liveAccCR}
                    />
                </div>
            </div>
        </div>
    );
});

export default ApolloAnalysisPage;
