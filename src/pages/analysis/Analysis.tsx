"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

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

const WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089"

const Analysis: React.FC = () => {
  const [tickHistory, setTickHistory] = useState<Tick[]>([])
  const getInitialSymbol = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("selectedSymbol") || "R_10"
    }
    return "R_10"
  }
  const [currentSymbol, setCurrentSymbol] = useState(getInitialSymbol())
  const tickCount = 1000
  const [decimalPlaces, setDecimalPlaces] = useState(2)
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const derivWsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [symbolsList, setSymbolsList] = useState<SymbolData[]>([])
  const [showMore, setShowMore] = useState(false)
  const [pipSize, setPipSize] = useState(2)
  const [currentlySubscribedSymbol, setCurrentlySubscribedSymbol] = useState<string | null>(null)

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (derivWsRef.current) {
        derivWsRef.current.onclose = null
        derivWsRef.current.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    if (derivWsRef.current) {
      derivWsRef.current.onclose = null
      derivWsRef.current.close()
    }

    const ws = new WebSocket(WS_URL)
    derivWsRef.current = ws

    ws.onopen = () => {
      console.log("WebSocket connected")
      setIsConnected(true)
      
      ws.send(
        JSON.stringify({
          active_symbols: "brief",
          product_type: "basic",
        }),
      )
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.msg_type === "active_symbols") {
        console.log("Received active symbols")
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

        if (volatilitySymbols.length > 0) {
          const symbolToUse = volatilitySymbols.find((s: SymbolData) => s.symbol === currentSymbol)
            ? currentSymbol
            : volatilitySymbols[0].symbol
          
          console.log("Subscribing to symbol:", symbolToUse)
          ws.send(
            JSON.stringify({
              ticks_history: symbolToUse,
              count: tickCount,
              end: "latest",
              style: "ticks",
              subscribe: 1,
            }),
          )
          setCurrentlySubscribedSymbol(symbolToUse)
        }
      }

      if (data.msg_type === "history") {
        console.log("Received tick history, prices count:", data.history?.prices?.length)
        const newTickHistory = data.history.prices.map((price: string, index: number) => ({
          time: data.history.times[index],
          quote: Number.parseFloat(price),
        }))
        setTickHistory(newTickHistory)
        detectDecimalPlaces(newTickHistory)
        if (data.pip_size !== undefined) {
          setPipSize(data.pip_size)
        }
      } else if (data.msg_type === "tick") {
        if (data.tick.symbol === currentlySubscribedSymbol) {
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

      if (data.error) {
        console.error("WebSocket error:", data.error)
      }
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected, reconnecting...")
      setIsConnected(false)
      setCurrentlySubscribedSymbol(null)
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 2000)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error occurred:", error)
      setIsConnected(false)
    }
  }

  const requestTickHistory = (symbol: string) => {
    if (derivWsRef.current && derivWsRef.current.readyState === WebSocket.OPEN) {
      console.log("Requesting tick history for:", symbol)
      
      if (currentlySubscribedSymbol && currentlySubscribedSymbol !== symbol) {
        derivWsRef.current.send(
          JSON.stringify({
            forget_all: "ticks",
          }),
        )
      }

      const request = {
        ticks_history: symbol,
        count: tickCount,
        end: "latest",
        style: "ticks",
        subscribe: 1,
      }
      derivWsRef.current.send(JSON.stringify(request))
      setCurrentlySubscribedSymbol(symbol)
    }
  }

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
    if (tickHistory.length === 0) return new Array(10).fill(0)
    const digitCounts = new Array(10).fill(0)
    tickHistory.forEach((tick) => {
      const lastDigit = getLastDigit(tick.quote)
      digitCounts[lastDigit]++
    })
    return digitCounts.map((count) => (count / tickHistory.length) * 100)
  }

  const getEvenOddAnalysis = () => {
    if (tickHistory.length === 0) return { even: 0, odd: 0 }
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
    if (tickHistory.length < 2) return { rise: 0, fall: 0 }
    let riseCount = 0, fallCount = 0
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
    if (selectedDigit === null || tickHistory.length === 0) return { over: 0, under: 0, equal: 0 }
    let overCount = 0, underCount = 0, equalCount = 0
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

  const handleSymbolChange = (newSymbol: string) => {
    console.log("Changing symbol to:", newSymbol)
    setCurrentSymbol(newSymbol)
    if (typeof window !== 'undefined') {
      localStorage.setItem("selectedSymbol", newSymbol)
    }
    setTickHistory([])
    setTimeout(() => {
      requestTickHistory(newSymbol)
    }, 100)
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
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1), transparent 70%), radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.1), transparent 70%), #030712',
      color: '#f8fafc'
    }}>
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px 24px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        {/* Connection Status */}
        <div style={{
          textAlign: 'center',
          padding: '12px',
          borderRadius: '12px',
          background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: isConnected ? '#10b981' : '#ef4444',
          fontWeight: 600
        }}>
          {isConnected ? '● Connected' : '○ Reconnecting...'}
        </div>

        {/* Price & Market Selector */}
        <section style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '48px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              {currentPrice ? currentPrice.toFixed(pipSize) : "N/A"}
            </div>
            <div style={{ color: '#9ca3af' }}>Current Price</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <select
              value={currentSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                color: '#f8fafc',
                padding: '14px 20px',
                fontSize: '16px',
                minWidth: '180px',
                cursor: 'pointer'
              }}
            >
              {symbolsList.length > 0 ? (
                symbolsList.map((opt) => (
                  <option key={opt.symbol} value={opt.symbol}>
                    {opt.display_name}
                  </option>
                ))
              ) : (
                <option>Loading...</option>
              )}
            </select>
            <div style={{ color: '#6b7280', marginTop: '8px', fontSize: '12px' }}>MARKET</div>
          </div>
        </section>

        {tickHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '18px' }}>
            {isConnected ? 'Loading market data...' : 'Connecting to market...'}
          </div>
        ) : (
          <>
            {/* Digit Distribution */}
            <section style={{
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '24px',
              padding: '40px'
            }}>
              <h2 style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
                Digit Distribution
              </h2>
              <div style={{
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '16px 20px',
                  borderBottom: '1px solid #374151'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af' }}>
                    Latest digits ({displayCount} showing)
                  </span>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
                    gap: '10px'
                  }}>
                    {lastDisplayedDigits.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          borderRadius: '12px',
                          fontWeight: 900,
                          fontSize: '18px',
                          background: d % 2 === 0 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))'
                            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.15))',
                          color: d % 2 === 0 ? '#10b981' : '#ef4444',
                          border: `2px solid ${d % 2 === 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                          borderWidth: i === lastDisplayedDigits.length - 1 ? '3px' : '2px',
                          boxShadow: i === lastDisplayedDigits.length - 1 
                            ? (d % 2 === 0 ? '0 0 24px rgba(16, 185, 129, 0.5)' : '0 0 24px rgba(239, 68, 68, 0.5)')
                            : 'none'
                        }}
                      >
                        {d}
                        {i === lastDisplayedDigits.length - 1 && (
                          <span style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            fontSize: '18px',
                            color: '#3b82f6'
                          }}>●</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '16px 20px',
                  borderTop: '1px solid #374151',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => setShowMore(!showMore)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {showMore ? '← Show Less (50)' : 'Show More (100) →'}
                  </button>
                </div>
              </div>
            </section>

            {/* Statistics */}
            <section style={{
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '24px',
              padding: '40px'
            }}>
              <h2 style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
                Statistics
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#1f2937',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #374151'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#9ca3af' }}>
                    Total Ticks:
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>
                    {tickHistory.length}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#1f2937',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #374151'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#9ca3af' }}>
                    Pip Size:
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>
                    {pipSize}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div> style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                gap: '24px',
                marginBottom: '20px'
              }}>
                {digitAnalysis.map((pct, digit) => {
                  const isLowest = pct === minPercentage && pct > 0
                  const isHighest = pct === maxPercentage && pct > 0
                  const fillPct = maxPercentage > 0 ? (pct / maxPercentage) * 100 : 0
                  return (
                    <div key={digit} style={{ textAlign: 'center', position: 'relative' }}>
                      {digit === currentDigit && (
                        <div style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          color: '#3b82f6',
                          fontSize: '20px'
                        }}>▼</div>
                      )}
                      <div style={{
                        width: '100px',
                        height: '100px',
                        margin: '0 auto',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg viewBox="0 0 64 64" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                          <circle
                            cx="32"
                            cy="32"
                            r="26"
                            fill="none"
                            stroke={isLowest ? '#ef4444' : isHighest ? '#10b981' : '#374151'}
                            strokeWidth="4"
                            strokeDasharray={`${(fillPct / 100) * 163.4} 163.4`}
                            strokeLinecap="round"
                            transform="rotate(-90 32 32)"
                          />
                        </svg>
                        <div style={{
                          fontSize: digit === currentDigit ? '36px' : '28px',
                          fontWeight: 900,
                          color: digit === currentDigit ? '#3b82f6' : isHighest ? '#10b981' : isLowest ? '#ef4444' : '#f8fafc',
                          position: 'relative'
                        }}>
                          {digit}
                        </div>
                      </div>
                      <div style={{
                        marginTop: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isHighest ? '#10b981' : isLowest ? '#ef4444' : '#9ca3af'
                      }}>
                        {pct.toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                Highest: <span style={{ color: '#10b981', fontWeight: 700 }}>{maxPercentage.toFixed(2)}%</span>
                {' | '}
                Lowest: <span style={{ color: '#ef4444', fontWeight: 700 }}>{minPercentage.toFixed(2)}%</span>
              </div>
            </section>

            {/* Digit Comparison */}
            <section style={{
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '24px',
              padding: '40px'
            }}>
              <h2 style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
                Digit Comparison
              </h2>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ color: '#9ca3af', marginBottom: '12px' }}>Select a digit:</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDigit(d)}
                      style={{
                        background: selectedDigit === d ? '#3b82f6' : '#1f2937',
                        border: `2px solid ${selectedDigit === d ? '#3b82f6' : '#374151'}`,
                        color: selectedDigit === d ? '#fff' : '#f8fafc',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              {selectedDigit !== null && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '16px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.04))',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#3b82f6', marginBottom: '8px' }}>
                      {selectedDigitAnalysis.over.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 700 }}>
                      OVER {selectedDigit}
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(8, 145, 178, 0.04))',
                    border: '2px solid rgba(6, 182, 212, 0.5)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#06b6d4', marginBottom: '8px' }}>
                      {selectedDigitAnalysis.under.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 700 }}>
                      UNDER {selectedDigit}
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 255, 0.04))',
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#8b5cf6', marginBottom: '8px' }}>
                      {selectedDigitAnalysis.equal.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 700 }}>
                      EQUAL {selectedDigit}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Even/Odd Pattern */}
            <section style={{
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '24px',
              padding: '40px'
            }}>
              <h2 style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
                Even/Odd Pattern
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.04))',
                  border: '2px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#10b981', marginBottom: '8px' }}>
                    {evenOddAnalysis.even.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 700 }}>EVEN</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.04))',
                  border: '2px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#ef4444', marginBottom: '8px' }}>
                    {evenOddAnalysis.odd.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 700 }}>ODD</div>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Last 50 Digits Pattern</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                  gap: '8px'
                }}>
                  {lastDisplayedDigits.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '12px',
                        background: d % 2 === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: d % 2 === 0 ? '#10b981' : '#ef4444',
                        border: `1px solid ${d % 2 === 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                      }}
                    >
                      {d % 2 === 0 ? 'E' : 'O'}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Rise/Fall */}
            <section style={{
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '24px',
              padding: '40px'
            }}>
              <h2 style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
                Market Movement
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.04))',
                  border: '2px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#10b981', marginBottom: '8px' }}>
                    {riseFallAnalysis.rise.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 700 }}>RISE</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.04))',
                  border: '2px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#ef4444', marginBottom: '8px' }}>
                    {riseFallAnalysis.fall.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 700 }}>FALL</div>
                </div>
              </div>
            </section>

            {/* Last Digits Stream */}
            <section style={{
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '24px',
              padding: '40px'
            }}>
              <h2 style={{ fontSize: '28px', marginBottom: '24px', textAlign: 'center' }}>
                Last Digits Stream
              </h2>
              <div
