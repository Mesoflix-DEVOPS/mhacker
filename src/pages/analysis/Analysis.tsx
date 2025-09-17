import React, { useState, useEffect, useRef } from 'react';
import './analysis.scss';

interface Tick {
  time: number;
  quote: number;
}

const WS_URL = 'wss://ws.binaryws.com/websockets/v3?app_id=82991';

const Analysis: React.FC = () => {
  const [tickHistory, setTickHistory] = useState<Tick[]>([]);
  // Load selected symbol from localStorage, fallback to R_100
  const getInitialSymbol = () => localStorage.getItem('selectedSymbol') || 'R_100';
  const [currentSymbol, setCurrentSymbol] = useState(getInitialSymbol());
  const tickCount = 1000;
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const derivWsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Symbol options
  const symbolOptions = [
    { value: "R_10", label: "Vol 10" },
    { value: "1HZ10V", label: "Vol 10 (1s)" },
    { value: "R_25", label: "Vol 25" },
    { value: "1HZ25V", label: "Vol 25 (1s)" },
    { value: "R_50", label: "Vol 50" },
    { value: "1HZ50V", label: "Vol 50 (1s)" },
    { value: "R_75", label: "Vol 75" },
    { value: "1HZ75V", label: "Vol 75 (1s)" },
    { value: "R_100", label: "Vol 100" },
    { value: "1HZ100V", label: "Vol 100 (1s)" },
    { value: "JD10", label: "Jump 10" },
    { value: "JD25", label: "Jump 25" },
    { value: "JD50", label: "Jump 50" },
    { value: "JD100", label: "Jump 100" },
    { value: "RDBEAR", label: "Bear Market" },
    { value: "RDBULL", label: "Bull Market" }
  ];

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (derivWsRef.current) derivWsRef.current.close();
    };
  }, []);

  // WebSocket connection management (with auto-reconnect)
  const connectWebSocket = () => {
    if (derivWsRef.current) {
      derivWsRef.current.onclose = null; // Remove handler to avoid double reconnect!
      derivWsRef.current.close();
    }

    const ws = new window.WebSocket(WS_URL);
    derivWsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      requestTickHistory();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.history) {
        const newTickHistory = data.history.prices.map((price: string, index: number) => ({
          time: data.history.times[index],
          quote: parseFloat(price)
        }));
        setTickHistory(newTickHistory);
        detectDecimalPlaces(newTickHistory);
      } else if (data.tick) {
        const tickQuote = parseFloat(data.tick.quote);
        setTickHistory(prev => {
          const updated = [...prev, { time: data.tick.epoch, quote: tickQuote }];
          return updated.length > tickCount ? updated.slice(-tickCount) : updated;
        });
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Try to reconnect after 2 seconds (if component is still mounted)
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 2000);
    };

    ws.onerror = () => {
      setIsConnected(false);
      // Try to reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 2000);
    };
  };

  // Request tick history for current symbol
  const requestTickHistory = () => {
    if (derivWsRef.current && derivWsRef.current.readyState === WebSocket.OPEN) {
      const request = {
        ticks_history: currentSymbol,
        count: tickCount,
        end: "latest",
        style: "ticks",
        subscribe: 1
      };
      derivWsRef.current.send(JSON.stringify(request));
    }
  };

  // Detect decimals for price formatting
  const detectDecimalPlaces = (history: Tick[]) => {
    if (history.length === 0) return;
    const decimalCounts = history.map(tick => {
      const decimalPart = tick.quote.toString().split(".")[1] || "";
      return decimalPart.length;
    });
    setDecimalPlaces(Math.max(...decimalCounts, 2));
  };

  // Get last digit helper
  const getLastDigit = (price: number): number => {
    const priceStr = price.toString();
    const priceParts = priceStr.split(".");
    let decimals = priceParts[1] || "";
    while (decimals.length < decimalPlaces) {
      decimals += "0";
    }
    return Number(decimals.slice(-1));
  };

  // Analysis calculations (unchanged)
  const getDigitAnalysis = () => {
    const digitCounts = new Array(10).fill(0);
    tickHistory.forEach(tick => {
      const lastDigit = getLastDigit(tick.quote);
      digitCounts[lastDigit]++;
    });
    return digitCounts.map(count => (count / tickHistory.length) * 100);
  };

  const getEvenOddAnalysis = () => {
    const digitCounts = new Array(10).fill(0);
    tickHistory.forEach(tick => {
      const lastDigit = getLastDigit(tick.quote);
      digitCounts[lastDigit]++;
    });
    const evenCount = digitCounts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    const oddCount = digitCounts.filter((_, i) => i % 2 !== 0).reduce((a, b) => a + b, 0);
    const total = evenCount + oddCount;
    return {
      even: total > 0 ? (evenCount / total) * 100 : 0,
      odd: total > 0 ? (oddCount / total) * 100 : 0
    };
  };

  const getRiseFallAnalysis = () => {
    let riseCount = 0, fallCount = 0;
    for (let i = 1; i < tickHistory.length; i++) {
      if (tickHistory[i].quote > tickHistory[i - 1].quote) riseCount++;
      else if (tickHistory[i].quote < tickHistory[i - 1].quote) fallCount++;
    }
    const total = riseCount + fallCount;
    return {
      rise: total > 0 ? (riseCount / total) * 100 : 0,
      fall: total > 0 ? (fallCount / total) * 100 : 0
    };
  };

  const getSelectedDigitAnalysis = () => {
    if (selectedDigit === null) return { over: 0, under: 0, equal: 0 };
    let overCount = 0, underCount = 0, equalCount = 0;
    tickHistory.forEach(tick => {
      const lastDigit = getLastDigit(tick.quote);
      if (lastDigit > selectedDigit) overCount++;
      else if (lastDigit < selectedDigit) underCount++;
      else equalCount++;
    });
    const total = tickHistory.length;
    return {
      over: total > 0 ? (overCount / total) * 100 : 0,
      under: total > 0 ? (underCount / total) * 100 : 0,
      equal: total > 0 ? (equalCount / total) * 100 : 0
    };
  };

  // Symbol change handler (persists to localStorage)
  const handleSymbolChange = (newSymbol: string) => {
    setCurrentSymbol(newSymbol);
    localStorage.setItem('selectedSymbol', newSymbol);
    setTickHistory([]);
    // When symbol changes, request new tickHistory after connection
    setTimeout(() => {
      requestTickHistory();
    }, 500);
  };

  // Re-connect websocket when symbol changes
  useEffect(() => {
    connectWebSocket();
    // Clean up previous WebSocket and timeout
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (derivWsRef.current) derivWsRef.current.close();
    };
    // eslint-disable-next-line
  }, [currentSymbol]);

  // Render data as before
  const digitAnalysis = getDigitAnalysis();
  const evenOddAnalysis = getEvenOddAnalysis();
  const riseFallAnalysis = getRiseFallAnalysis();
  const selectedDigitAnalysis = getSelectedDigitAnalysis();
  const currentPrice = tickHistory.length > 0 ? tickHistory[tickHistory.length - 1].quote : null;
  const currentDigit = currentPrice ? getLastDigit(currentPrice) : null;
  const maxPercentage = Math.max(...digitAnalysis);
  const minPercentage = Math.min(...digitAnalysis.filter(p => p > 0));
  const last50Digits = tickHistory.slice(-50).map(tick => getLastDigit(tick.quote));

  return (
    <div className="analysis-container">
      <main className="analysis-main">
        {/* Current Price with Market Selector */}
        <section className="price-section">
          <div className="price-content">
            <div className="current-price">
              {currentPrice ? currentPrice.toFixed(decimalPlaces) : 'N/A'}
            </div>
            <div className="price-label">Current Price</div>
          </div>
          <div className="market-selector">
            <select
              value={currentSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="symbol-select"
            >
              {symbolOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="selector-label">Market</div>
          </div>
        </section>

        {/* Digit Analysis */}
        <section className="analysis-section">
          <h2 className="section-title">Digit Distribution</h2>
          <div className="digit-grid">
            {digitAnalysis.map((percentage, digit) => {
              const isLowest = percentage === minPercentage && percentage > 0;
              const isHighest = percentage === maxPercentage && percentage > 0;
              const fillPercentage = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
              return (
                <div key={digit} className="digit-container">
                  {digit === currentDigit && (
                    <div className="current-indicator">▼</div>
                  )}
                  <div className="digit-circle-wrapper">
                    <div className="digit-circle">
                      <svg className="progress-ring" viewBox="0 0 64 64">
                        <circle
                          className="progress-ring-circle"
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke={isLowest ? "#ef4444" : isHighest ? "#10b981" : "#374151"}
                          strokeWidth="4"
                          strokeDasharray={`${(fillPercentage / 100) * 163.4} 163.4`}
                          strokeLinecap="round"
                          transform="rotate(-90 32 32)"
                        />
                      </svg>
                      <div className={`digit-number ${
                        digit === currentDigit ? 'current' : 
                        isLowest ? 'lowest' : 
                        isHighest ? 'highest' : ''
                      }`}>
                        {digit}
                      </div>
                    </div>
                  </div>
                  <div className={`digit-percentage ${
                    isLowest ? 'lowest' : 
                    isHighest ? 'highest' : ''
                  }`}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="analysis-stats">
            Highest: <span className="stat-highest">{maxPercentage.toFixed(2)}%</span> | 
            Lowest: <span className="stat-lowest">{minPercentage.toFixed(2)}%</span>
          </div>
        </section>

        {/* Selected Digit Analysis */}
        <section className="analysis-section">
          <h2 className="section-title">Digit Comparison</h2>
          <div className="digit-selector">
            <div className="selector-label">Select a digit to analyze:</div>
            <div className="digit-buttons">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                <button
                  key={digit}
                  className={`digit-btn ${selectedDigit === digit ? 'selected' : ''}`}
                  onClick={() => setSelectedDigit(digit)}
                >
                  {digit}
                </button>
              ))}
            </div>
          </div>
          {selectedDigit !== null && (
            <div className="comparison-analysis">
              <div className="comparison-grid">
                <div className="stat-card over">
                  <div className="stat-value">{selectedDigitAnalysis.over.toFixed(1)}%</div>
                  <div className="stat-label">Over {selectedDigit}</div>
                </div>
                <div className="stat-card under">
                  <div className="stat-value">{selectedDigitAnalysis.under.toFixed(1)}%</div>
                  <div className="stat-label">Under {selectedDigit}</div>
                </div>
                <div className="stat-card equal">
                  <div className="stat-value">{selectedDigitAnalysis.equal.toFixed(1)}%</div>
                  <div className="stat-label">Equal {selectedDigit}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Even/Odd Analysis */}
        <section className="analysis-section">
          <h2 className="section-title">Even/Odd Pattern</h2>
          <div className="eo-grid">
            <div className="stat-card even">
              <div className="stat-value">{evenOddAnalysis.even.toFixed(1)}%</div>
              <div className="stat-label">Even</div>
            </div>
            <div className="stat-card odd">
              <div className="stat-value">{evenOddAnalysis.odd.toFixed(1)}%</div>
              <div className="stat-label">Odd</div>
            </div>
          </div>
          <div className="pattern-section">
            <h3 className="pattern-title">Last 50 Digits Pattern</h3>
            <div className="pattern-grid">
              {last50Digits.map((digit, index) => (
                <div
                  key={index}
                  className={`pattern-box ${digit % 2 === 0 ? 'even' : 'odd'}`}
                >
                  {digit % 2 === 0 ? 'E' : 'O'}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rise/Fall Analysis */}
        <section className="analysis-section">
          <h2 className="section-title">Market Movement</h2>
          <div className="rf-grid">
            <div className="stat-card rise">
              <div className="stat-value">{riseFallAnalysis.rise.toFixed(1)}%</div>
              <div className="stat-label">Rise</div>
            </div>
            <div className="stat-card fall">
              <div className="stat-value">{riseFallAnalysis.fall.toFixed(1)}%</div>
              <div className="stat-label">Fall</div>
            </div>
          </div>
        </section>

        {/* Advanced Statistics */}
        <section className="analysis-section">
          <h2 className="section-title">Statistics</h2>
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-name">Total Ticks:</span>
              <span className="stat-data">{tickHistory.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-name">Decimal Places:</span>
              <span className="stat-data">{decimalPlaces}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with connection status and tick info */}

    </div>
  );
};

export default Analysis;
