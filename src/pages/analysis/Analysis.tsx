"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import styles from "./analysis.module.css"

interface Tick {
  time: number
  quote: number
}

interface SymbolData {
  allow_forward_starting: number
  display_name: string
  display_order: number
  exchange_is_open: number
  is_trading_suspended: number
  market: string
  market_display_name: string
  pip: number
  subgroup: string
  subgroup_display_name: string
  submarket: string
  submarket_display_name: string
  symbol: string
  symbol_type: string
}

interface GroupedSymbols {
  volatility: SymbolData[]
  jump: SymbolData[]
  other: SymbolData[]
}

interface PendingRequest {
  resolve: (value: any) => void
  reject: (error: any) => void
  timeout: NodeJS.Timeout
}

const WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089"
const REQUEST_TIMEOUT = 10000
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

const Analysis: React.FC = () => {
  const [tickHistory, setTickHistory] = useState<Tick[]>([])
  const getInitialSymbol = () => localStorage.getItem("selectedSymbol") || "R_10"
  const [currentSymbol, setCurrentSymbol] = useState(getInitialSymbol())
  const tickCount = 1000
  const [decimalPlaces, setDecimalPlaces] = useState(2)
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [marketsLoaded, setMarketsLoaded] = useState(false)
  const derivWsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [symbolsList, setSymbolsList] = useState<SymbolData[]>([])
  const [groupedSymbols, setGroupedSymbols] = useState<GroupedSymbols>({
    volatility: [],
    jump: [],
    other: [],
  })
  const [showMore, setShowMore] = useState(false)
  const [pipSize, setPipSize] = useState(2)
  const currentlySubscribedSymbolRef = useRef<string | null>(null)
  const tickHistoryRef = useRef<Tick[]>([])
  const requestIdRef = useRef(1)
  const pendingRequestsRef = useRef<Map<number, PendingRequest>>(new Map())
  const messageQueueRef = useRef<(() => void)[]>([])
  const isProcessingQueueRef = useRef(false)
  const subscriptionStateRef = useRef<{
    symbol: string | null
    isSubscribed: boolean
    isUnsubscribing: boolean
  }>({
    symbol: null,
    isSubscribed: false,
    isUnsubscribing: false,
  })

  useEffect(() => {
    tickHistoryRef.current = tickHistory
  }, [tickHistory])

  const generateRequestId = (): number => {
    return requestIdRef.current++
  }

  const queueMessage = (fn: () => void) => {
    messageQueueRef.current.push(fn)
    processMessageQueue()
  }

  const processMessageQueue = async () => {
    if (isProcessingQueueRef.current || messageQueueRef.current.length === 0) return

    isProcessingQueueRef.current = true
    while (messageQueueRef.current.length > 0) {
      const fn = messageQueueRef.current.shift()
      if (fn) {
        fn()
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }
    isProcessingQueueRef.current = false
  }

  const sendRequest = (data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!derivWsRef.current || derivWsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"))
        return
      }

      const requestId = generateRequestId()
      const timeout = setTimeout(() => {
        pendingRequestsRef.current.delete(requestId)
        reject(new Error(`Request ${requestId} timed out`))
      }, REQUEST_TIMEOUT)

      pendingRequestsRef.current.set(requestId, { resolve, reject, timeout })

      const payload = { ...data, req_id: requestId }
      derivWsRef.current.send(JSON.stringify(payload))
    })
  }

  const connectWebSocket = () => {
    if (derivWsRef.current) {
      derivWsRef.current.onclose = null
      derivWsRef.current.close()
    }

    const ws = new window.WebSocket(WS_URL)
    derivWsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      console.log("[Analysis] WebSocket connected, requesting markets...")
      queueMessage(() => {
        sendRequest({
          active_symbols: "brief",
          product_type: "basic",
        }).catch((err) => {
          console.error("[Analysis] Market request failed:", err)
        })
      })
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.req_id && pendingRequestsRef.current.has(data.req_id)) {
        const pending = pendingRequestsRef.current.get(data.req_id)
        if (pending) {
          clearTimeout(pending.timeout)
          pendingRequestsRef.current.delete(data.req_id)

          if (data.error) {
            pending.reject(new Error(data.error.message || "Unknown error"))
          } else {
            pending.resolve(data)
          }
        }
      }

      if (data.msg_type === "active_symbols") {
        const { active_symbols } = data
        const volatilitySymbols = active_symbols.filter(
          (symbol: SymbolData) =>
            symbol.subgroup === "synthetics" &&
            (symbol.market === "synthetic_index" || symbol.market === "volatility_indices"),
        )

        const extractVolatilityLevel = (name: string): number => {
          const match = name.match(/\d+/)
          return match ? Number.parseInt(match[0], 10) : 0
        }

        volatilitySymbols.sort((a: SymbolData, b: SymbolData) => {
          const levelA = extractVolatilityLevel(a.display_name)
          const levelB = extractVolatilityLevel(b.display_name)
          return levelA - levelB
        })

        setSymbolsList(volatilitySymbols)

        const volatilityGroup: SymbolData[] = []
        const jumpGroup: SymbolData[] = []
        const otherGroup: SymbolData[] = []

        volatilitySymbols.forEach((symbol) => {
          const name = symbol.display_name.toLowerCase()
          if (name.includes("jump")) {
            jumpGroup.push(symbol)
          } else if (name.includes("volatility") || name.includes("vol") || symbol.market === "volatility_indices") {
            volatilityGroup.push(symbol)
          } else {
            otherGroup.push(symbol)
          }
        })

        setGroupedSymbols({
          volatility: volatilityGroup,
          jump: jumpGroup,
          other: otherGroup,
        })

        setMarketsLoaded(true)

        if (volatilitySymbols.length > 0 && !subscriptionStateRef.current.isSubscribed) {
          const symbolToUse = volatilitySymbols.find((s) => s.symbol === getInitialSymbol())
            ? getInitialSymbol()
            : volatilitySymbols[0].symbol

          console.log("[Analysis] Markets loaded, subscribing to:", symbolToUse)
          queueMessage(() => {
            subscribeToSymbol(symbolToUse)
          })
        }
      }

      if (data.history) {
        if (data.history.prices && data.history.times && data.history.prices.length > 0) {
          const newTickHistory = data.history.prices.map((price: string, index: number) => ({
            time: data.history.times[index],
            quote: Number.parseFloat(price),
          }))
          console.log("[Analysis] Received tick history:", newTickHistory.length, "ticks")
          setTickHistory(newTickHistory)
          detectDecimalPlaces(newTickHistory)
          if (data.pip_size !== undefined) {
            setPipSize(data.pip_size)
          }
          subscriptionStateRef.current.isSubscribed = true
        }
      } else if (data.tick) {
        if (data.tick.symbol === subscriptionStateRef.current.symbol) {
          const tickQuote = Number.parseFloat(data.tick.quote)
          setTickHistory((prev) => {
            const updated = [...prev, { time: data.tick.epoch, quote: tickQuote }]
            return updated.length > tickCount ? updated.slice(-tickCount) : updated
          })
          if (data.tick.pip_size !== undefined) {
            setPipSize(data.tick.pip_size)
          }
        }
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      setMarketsLoaded(false)
      console.log("[Analysis] WebSocket disconnected, reconnecting...")
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 2000)
    }

    ws.onerror = (error) => {
      setIsConnected(false)
      console.error("[Analysis] WebSocket error:", error)
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 2000)
    }
  }

  const subscribeToSymbol = async (symbol: string) => {
    if (symbol === subscriptionStateRef.current.symbol && subscriptionStateRef.current.isSubscribed) {
      console.log("[Analysis] Already subscribed to:", symbol)
      return
    }

    if (subscriptionStateRef.current.symbol && subscriptionStateRef.current.isSubscribed) {
      subscriptionStateRef.current.isUnsubscribing = true
      try {
        console.log("[Analysis] Unsubscribing from:", subscriptionStateRef.current.symbol)
        await sendRequest({
          forget: subscriptionStateRef.current.symbol,
        })
        console.log("[Analysis] Successfully unsubscribed")
      } catch (error) {
        console.error("[Analysis] Unsubscribe error:", error)
      }
      subscriptionStateRef.current.isUnsubscribing = false
    }

    subscriptionStateRef.current.symbol = symbol
    subscriptionStateRef.current.isSubscribed = false

    let retryCount = 0
    while (retryCount < RETRY_ATTEMPTS) {
      try {
        console.log(`[Analysis] Subscribing to ${symbol} (attempt ${retryCount + 1})`)
        setTickHistory([])

        await sendRequest({
          ticks_history: symbol,
          count: tickCount,
          end: "latest",
          style: "ticks",
          subscribe: 1,
        })

        await new Promise((resolve) => setTimeout(resolve, 100))
        subscriptionStateRef.current.isSubscribed = true
        console.log("[Analysis] Successfully subscribed to:", symbol)
        break
      } catch (error) {
        retryCount++
        console.warn(`[Analysis] Subscription attempt ${retryCount} failed:`, error)
        if (retryCount < RETRY_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        }
      }
    }

    if (retryCount === RETRY_ATTEMPTS) {
      console.error("[Analysis] Failed to subscribe after", RETRY_ATTEMPTS, "attempts")
      subscriptionStateRef.current.isSubscribed = false
    }
  }

  const handleSymbolChange = (newSymbol: string) => {
    setCurrentSymbol(newSymbol)
    localStorage.setItem("selectedSymbol", newSymbol)
    queueMessage(() => {
      subscribeToSymbol(newSymbol)
    })
  }

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (derivWsRef.current) derivWsRef.current.close()
      pendingRequestsRef.current.forEach(({ timeout }) => clearTimeout(timeout))
      pendingRequestsRef.current.clear()
    }
  }, [])

  const detectDecimalPlaces = (history: Tick[]) => {
    if (history.length === 0) return
    const decimalCounts = history.map((tick) => {
      const priceStr = tick.quote.toFixed(10)
      const decimalPart = priceStr.split(".")[1] || ""
      const trimmed = decimalPart.replace(/0+$/, "")
      return trimmed.length
    })
    const maxDecimals = Math.max(...decimalCounts, 2)
    setDecimalPlaces(Math.min(maxDecimals, 5))
  }

  const getLastDigit = (price: number): number => {
    const priceStr = price.toFixed(pipSize)
    const lastChar = priceStr.slice(-1)
    return Number.parseInt(lastChar, 10)
  }

  const getDigitAnalysis = () => {
    const digitCounts = new Array(10).fill(0)
    tickHistory.forEach((tick) => {
      const lastDigit = getLastDigit(tick.quote)
      digitCounts[lastDigit]++
    })
    return digitCounts.map((count) => (count / tickHistory.length) * 100)
  }

  const getEvenOddAnalysis = () => {
    const digitCounts = new Array(10).fill(0)
    tickHistory.forEach((tick) => {
      const lastDigit = getLastDigit(tick.quote)
      digitCounts[lastDigit]++
    })
    const evenCount = digitCounts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0)
    const oddCount = digitCounts.filter((_, i) => i % 2 !== 0).reduce((a, b) => a + b, 0)
    const total = evenCount + oddCount
    return {
      even: total > 0 ? (evenCount / total) * 100 : 0,
      odd: total > 0 ? (oddCount / total) * 100 : 0,
    }
  }

  const getRiseFallAnalysis = () => {
    let riseCount = 0,
      fallCount = 0
    for (let i = 1; i < tickHistory.length; i++) {
      if (tickHistory[i].quote > tickHistory[i - 1].quote) riseCount++
      else if (tickHistory[i].quote < tickHistory[i - 1].quote) fallCount++
    }
    const total = riseCount + fallCount
    return {
      rise: total > 0 ? (riseCount / total) * 100 : 0,
      fall: total > 0 ? (fallCount / total) * 100 : 0,
    }
  }

  const getSelectedDigitAnalysis = () => {
    if (selectedDigit === null) return { over: 0, under: 0, equal: 0 }
    let overCount = 0,
      underCount = 0,
      equalCount = 0
    tickHistory.forEach((tick) => {
      const lastDigit = getLastDigit(tick.quote)
      if (lastDigit > selectedDigit) overCount++
      else if (lastDigit < selectedDigit) underCount++
      else equalCount++
    })
    const total = tickHistory.length
    return {
      over: total > 0 ? (overCount / total) * 100 : 0,
      under: total > 0 ? (underCount / total) * 100 : 0,
      equal: total > 0 ? (equalCount / total) * 100 : 0,
    }
  }

  const digitAnalysis = getDigitAnalysis()
  const evenOddAnalysis = getEvenOddAnalysis()
  const riseFallAnalysis = getRiseFallAnalysis()
  const selectedDigitAnalysis = getSelectedDigitAnalysis()
  const currentPrice = tickHistory.length > 0 ? tickHistory[tickHistory.length - 1].quote : null
  const currentDigit = currentPrice ? getLastDigit(currentPrice) : null
  const maxPercentage = Math.max(...digitAnalysis)
  const minPercentage = Math.min(...digitAnalysis.filter((p) => p > 0))

  const allLastDigits = tickHistory.map((tick) => getLastDigit(tick.quote))
  const displayCount = showMore ? 100 : 50
  const lastDisplayedDigits = allLastDigits.slice(-displayCount)

  return (
    <div className={styles.analysisContainer}>
      <main className={styles.analysisMa}>
        <section className={styles.priceSection}>
          <div className={styles.priceContent}>
            <div className={styles.currentPrice}>{currentPrice ? currentPrice.toFixed(pipSize) : "N/A"}</div>
            <div className={styles.priceLabel}>Current Price</div>
          </div>
          <div className={styles.marketSelector}>
            <select
              value={currentSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className={styles.symbolSelect}
              disabled={!marketsLoaded}
            >
              {groupedSymbols.volatility.length > 0 && (
                <>
                  <optgroup label="VOLATILITY MARKETS">
                    {groupedSymbols.volatility.map((option) => (
                      <option key={option.symbol} value={option.symbol}>
                        {option.display_name}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
              {groupedSymbols.jump.length > 0 && (
                <>
                  <optgroup label="JUMP INDICES">
                    {groupedSymbols.jump.map((option) => (
                      <option key={option.symbol} value={option.symbol}>
                        {option.display_name}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
              {groupedSymbols.other.length > 0 && (
                <>
                  <optgroup label="OTHER MARKETS">
                    {groupedSymbols.other.map((option) => (
                      <option key={option.symbol} value={option.symbol}>
                        {option.display_name}
                      </option>
                    ))}
                  </optgroup>
                </>
              )}
              {!marketsLoaded && <option value="">Loading Markets...</option>}
            </select>
            <div className={styles.selectorLabel}>Market</div>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <h2 className={styles.sectionTitle}>Digit Distribution</h2>
          <div className={styles.digitGrid}>
            {digitAnalysis.map((percentage, digit) => {
              const isLowest = percentage === minPercentage && percentage > 0
              const isHighest = percentage === maxPercentage && percentage > 0
              const fillPercentage = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0
              return (
                <div key={digit} className={styles.digitContainer}>
                  {digit === currentDigit && <div className={styles.currentIndicator}>▼</div>}
                  <div className={styles.digitCircleWrapper}>
                    <div className={styles.digitCircle}>
                      <svg className={styles.progressRing} viewBox="0 0 64 64">
                        <circle
                          className={styles.progressRingCircle}
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
                      <div
                        className={`${styles.digitNumber} ${
                          digit === currentDigit
                            ? styles.current
                            : isLowest
                              ? styles.lowest
                              : isHighest
                                ? styles.highest
                                : ""
                        }`}
                      >
                        {digit}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${styles.digitPercentage} ${
                      isLowest ? styles.lowest : isHighest ? styles.highest : ""
                    }`}
                  >
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
          <div className={styles.analysisStats}>
            Highest: <span className={styles.statHighest}>{maxPercentage.toFixed(2)}%</span> | Lowest:{" "}
            <span className={styles.statLowest}>{minPercentage.toFixed(2)}%</span>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <h2 className={styles.sectionTitle}>Digit Comparison</h2>
          <div className={styles.digitSelector}>
            <div className={styles.selectorLabel}>Select a digit to analyze:</div>
            <div className={styles.digitButtons}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  className={`${styles.digitBtn} ${selectedDigit === digit ? styles.selected : ""}`}
                  onClick={() => setSelectedDigit(digit)}
                >
                  {digit}
                </button>
              ))}
            </div>
          </div>
          {selectedDigit !== null && (
            <div className={styles.comparisonAnalysis}>
              <div className={styles.comparisonGrid}>
                <div className={`${styles.statCard} ${styles.over}`}>
                  <div className={styles.statValue}>{selectedDigitAnalysis.over.toFixed(1)}%</div>
                  <div className={styles.statLabel}>Over {selectedDigit}</div>
                </div>
                <div className={`${styles.statCard} ${styles.under}`}>
                  <div className={styles.statValue}>{selectedDigitAnalysis.under.toFixed(1)}%</div>
                  <div className={styles.statLabel}>Under {selectedDigit}</div>
                </div>
                <div className={`${styles.statCard} ${styles.equal}`}>
                  <div className={styles.statValue}>{selectedDigitAnalysis.equal.toFixed(1)}%</div>
                  <div className={styles.statLabel}>Equal {selectedDigit}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className={styles.analysisSection}>
          <h2 className={styles.sectionTitle}>Even/Odd Pattern</h2>
          <div className={styles.eoGrid}>
            <div className={`${styles.statCard} ${styles.even}`}>
              <div className={styles.statValue}>{evenOddAnalysis.even.toFixed(1)}%</div>
              <div className={styles.statLabel}>Even</div>
            </div>
            <div className={`${styles.statCard} ${styles.odd}`}>
              <div className={styles.statValue}>{evenOddAnalysis.odd.toFixed(1)}%</div>
              <div className={styles.statLabel}>Odd</div>
            </div>
          </div>
          <div className={styles.patternSection}>
            <h3 className={styles.patternTitle}>Last 50 Digits Pattern</h3>
            <div className={styles.patternGrid}>
              {lastDisplayedDigits.map((digit, index) => (
                <div key={index} className={`${styles.patternBox} ${digit % 2 === 0 ? styles.even : styles.odd}`}>
                  {digit % 2 === 0 ? "E" : "O"}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <h2 className={styles.sectionTitle}>Market Movement</h2>
          <div className={styles.rfGrid}>
            <div className={`${styles.statCard} ${styles.rise}`}>
              <div className={styles.statValue}>{riseFallAnalysis.rise.toFixed(1)}%</div>
              <div className={styles.statLabel}>Rise</div>
            </div>
            <div className={`${styles.statCard} ${styles.fall}`}>
              <div className={styles.statValue}>{riseFallAnalysis.fall.toFixed(1)}%</div>
              <div className={styles.statLabel}>Fall</div>
            </div>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <h2 className={styles.sectionTitle}>Last Digits Stream</h2>
          <div className={styles.lastDigitsContainer}>
            <div className={styles.lastDigitsTable}>
              <div className={styles.digitsHeader}>
                <span className={styles.headerLabel}>Latest digits ({displayCount} showing)</span>
              </div>
              <div className={styles.digitsContent}>
                <div className={styles.digitsGrid}>
                  {lastDisplayedDigits.map((digit, index) => (
                    <div
                      key={index}
                      className={`${styles.digitItem} ${digit % 2 === 0 ? styles.evenDigit : styles.oddDigit} ${
                        index === lastDisplayedDigits.length - 1 ? styles.latest : ""
                      }`}
                      title={`Position ${displayCount - index}: ${digit}`}
                    >
                      <span className={styles.digitValue}>{digit}</span>
                      {index === lastDisplayedDigits.length - 1 && <span className={styles.latestIndicator}>●</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.digitsFooter}>
                <button className={styles.toggleBtn} onClick={() => setShowMore(!showMore)}>
                  {showMore ? "← Show Less (50)" : "Show More (100) →"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <h2 className={styles.sectionTitle}>Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statRow}>
              <span className={styles.statName}>Total Ticks:</span>
              <span className={styles.statData}>{tickHistory.length}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statName}>Pip Size:</span>
              <span className={styles.statData}>{pipSize}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Analysis
