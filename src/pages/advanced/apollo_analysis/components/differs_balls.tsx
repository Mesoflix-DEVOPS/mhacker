import React, { useState } from 'react';
import { api_base, getLiveAccToken, getToken } from '@deriv/bot-skeleton';

type DigitDiffStatsProp = {
    value: number;
    appearence: number;
};

type DiffersBallType = {
    lastDigitList: number[];
    active_last: number;
    isOneClickActive: boolean;
    contract_type: string;
    duration: number;
    active_symbol: string;
    stake_amount: number | string;
    isAutoClickerActive: boolean;
    prevLowestValue: string | number;
    digitDiffHigh: React.MutableRefObject<DigitDiffStatsProp>;
    digitDiffLow: React.MutableRefObject<DigitDiffStatsProp>;
    isTradeActive: boolean;
    tradingDiffType: string;
    enableCopyDemo: boolean;
    isTradeActiveRef: React.MutableRefObject<boolean>;
    liveAccCR: string;
    setIsTradeActive: React.Dispatch<React.SetStateAction<boolean>>;
    setPrevLowestValue: React.Dispatch<React.SetStateAction<string | number>>;
};

const DiffersBalls = ({
    lastDigitList,
    active_last,
    contract_type,
    duration,
    isOneClickActive,
    active_symbol,
    stake_amount,
    isAutoClickerActive,
    digitDiffHigh,
    digitDiffLow,
    isTradeActive,
    isTradeActiveRef,
    tradingDiffType,
    enableCopyDemo,
    liveAccCR,
    setIsTradeActive,
}: DiffersBallType) => {
    const buy_contract = (prediction: string) => {
        if (isOneClickActive) {
            !enableCopyDemo
                ? api_base.api.send({
                      buy: '1',
                      price: stake_amount,
                      subscribe: 1,
                      parameters: {
                          amount: stake_amount,
                          basis: 'stake',
                          contract_type,
                          currency: 'USD',
                          duration,
                          duration_unit: 't',
                          symbol: active_symbol,
                          barrier: prediction,
                      },
                  })
                : api_base.api.send({
                      buy_contract_for_multiple_accounts: '1',
                      tokens: [getToken().token, getLiveAccToken(liveAccCR).token],
                      price: stake_amount,
                      parameters: {
                          amount: stake_amount,
                          basis: 'stake',
                          contract_type,
                          currency: 'USD',
                          duration,
                          duration_unit: 't',
                          symbol: active_symbol,
                          barrier: prediction,
                      },
                  });
        }
    };

    const buy_contract2 = (prediction: string) => {
        if (isOneClickActive && isAutoClickerActive && !isTradeActive && tradingDiffType !== 'MANUAL') {
            isTradeActiveRef.current = true;
            setIsTradeActive(true);
            !enableCopyDemo
                ? api_base.api.send({
                      buy: '1',
                      price: stake_amount,
                      subscribe: 1,
                      parameters: {
                          amount: stake_amount,
                          basis: 'stake',
                          contract_type,
                          currency: 'USD',
                          duration,
                          duration_unit: 't',
                          symbol: active_symbol,
                          barrier: prediction,
                      },
                  })
                : api_base.api.send({
                      buy_contract_for_multiple_accounts: '1',
                      tokens: [getToken().token, getLiveAccToken(liveAccCR).token],
                      price: stake_amount,
                      parameters: {
                          amount: stake_amount,
                          basis: 'stake',
                          contract_type,
                          currency: 'USD',
                          duration,
                          duration_unit: 't',
                          symbol: active_symbol,
                          barrier: prediction,
                      },
                  });
        }
    };

    const strat101 = () => {
        let frequency = new Array(10).fill(0);
        lastDigitList.forEach(number => {
            frequency[number]++;
        });

        let leastFrequentValue = Math.min(...frequency);
        let leastFrequentDigits: number[] = [];

        frequency.forEach((count, digit) => {
            if (count === leastFrequentValue) {
                leastFrequentDigits.push(digit);
            }
        });

        let prediction = leastFrequentDigits[0];
        buy_contract2(prediction.toString());
    };

    const calculatePercentageAppearance = (numbers: number[]): Record<string, number> => {
        // Initialize an object to store the count of each number
        let counts: Record<string, number> = {};

        // Count the occurrences of each number in the array
        numbers.forEach(number => {
            counts[number] = (counts[number] || 0) + 1;
        });

        // Calculate the total number of elements in the array
        let totalNumbers = numbers.length;

        // Initialize an object to store the percentage appearance of each number
        let percentages: Record<string, number> = {};

        // Calculate the percentage appearance of each number
        for (let number in counts) {
            percentages[number] = (counts[number] / totalNumbers) * 100;
        }

        // Ensure that all numbers from 0 to 9 are included in the percentages object
        for (let i = 0; i <= 9; i++) {
            let numStr = i.toString();
            percentages[numStr] = percentages[numStr] || 0;
        }

        if (typeof document !== 'undefined') {
            highlightActiveBall(active_last);
            findMinMaxKeys(percentages);
        }

        return percentages;
    };

    const highlightActiveBall = (number: number) => {
        // Use querySelectorAll with type assertion to HTMLElement because querySelectorAll returns NodeList of Elements
        const progressBalls = document.querySelectorAll<HTMLElement>('.progress');

        progressBalls.forEach(ball => {
            ball.classList.remove('active');
            // Use the dataset property safely by ensuring ball is treated as HTMLElement
            if (parseInt(ball.dataset.number!) === number) {
                // Use non-null assertion for dataset properties
                ball.classList.add('active');
            }
        });
    };

    const findMinMaxKeys = (input: Record<string, number>): { maxKey: string; minKey: string } => {
        let maxKey: string = '';
        let minKey: string = '';
        let maxValue: number = -Infinity;
        let minValue: number = Infinity;
        // Use querySelectorAll with type assertion to HTMLElement because querySelectorAll returns NodeList of Elements
        const progressBalls = document.querySelectorAll<HTMLElement>('.progress');

        for (const [key, value] of Object.entries(input)) {
            // Update max value and key
            if (value > maxValue) {
                maxValue = value;
                maxKey = key;
            }
            // Update min value and key, ignoring zero values
            if (value < minValue && value > 0) {
                minValue = value;
                minKey = key;
            }
        }

        const calculateAppearance = () => {
            if (active_last === digitDiffLow.current.value) {
                digitDiffLow.current.appearence++;
            } else {
                digitDiffLow.current.value = parseFloat(minKey);
                digitDiffLow.current.appearence = 0;
            }

            if (active_last === digitDiffHigh.current.value) {
                digitDiffHigh.current.appearence++;
            } else {
                digitDiffHigh.current.value = parseFloat(maxKey);
                digitDiffHigh.current.appearence = 0;
            }

            if (digitDiffLow.current.appearence === 2) {
                buy_contract2(digitDiffLow.current.value.toString());
                digitDiffLow.current.appearence = 0;
                digitDiffHigh.current.appearence = 0;
            } else if (digitDiffHigh.current.appearence === 2) {
                buy_contract2(digitDiffHigh.current.value.toString());
                digitDiffHigh.current.appearence = 0;
                digitDiffLow.current.appearence = 0;
            }
        };

        strat101();

        progressBalls.forEach(ball => {
            ball.classList.remove('top');
            ball.classList.remove('less');
            if (parseInt(ball.dataset.number!) === parseFloat(minKey)) {
                ball.classList.add('less');
            }

            if (parseInt(ball.dataset.number!) === parseFloat(maxKey)) {
                ball.classList.add('top');
            }
        });

        // if (prevLowestValue === '') {
        //     setPrevLowestValue(parseFloat(minKey));
        // } else if (prevLowestValue !== parseFloat(minKey)) {
        //     setPrevLowestValue(parseFloat(minKey));
        //     if (isAutoClickerActive && parseFloat(minKey) !== active_last) {
        //         buy_contract(minKey);
        //     }
        // }

        return { maxKey, minKey };
    };

    let percentages: Record<string, number> = calculatePercentageAppearance(lastDigitList);

    return (
        <div>
            <div className='differs_container'>
                <div className='progress top' data-number='0' onClick={() => buy_contract('0')}>
                    <h3>0</h3>
                    <h4>
                        {percentages['0'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress' data-number='1' onClick={() => buy_contract('1')}>
                    <h3>1</h3>
                    <h4>
                        {percentages['1'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress' data-number='2' onClick={() => buy_contract('2')}>
                    <h3>2</h3>
                    <h4>
                        {percentages['2'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress' data-number='3' onClick={() => buy_contract('3')}>
                    <h3>3</h3>
                    <h4>
                        {percentages['3'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress less' data-number='4' onClick={() => buy_contract('4')}>
                    <h3>4</h3>
                    <h4>
                        {percentages['4'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress' data-number='5' onClick={() => buy_contract('5')}>
                    <h3>5</h3>
                    <h4>
                        {percentages['5'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress' data-number='6' onClick={() => buy_contract('6')}>
                    <h3>6</h3>
                    <h4>
                        {percentages['6'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress' data-number='7' onClick={() => buy_contract('7')}>
                    <h3>7</h3>
                    <h4>
                        {percentages['7'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress' data-number='8' onClick={() => buy_contract('8')}>
                    <h3>8</h3>
                    <h4>
                        {percentages['8'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
                <div className='progress' data-number='9' onClick={() => buy_contract('9')}>
                    <h3>9</h3>
                    <h4>
                        {percentages['9'].toFixed(2)}
                        <span>%</span>
                    </h4>
                </div>
            </div>
        </div>
    );
};

export default DiffersBalls;
