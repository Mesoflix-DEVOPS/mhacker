"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import "./advanced.scss"

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

const Advanced = () => {
  const [activeSymbol, setActiveSymbol] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedSymbol") || "R_100"
    }
    return "R_100"
  })
  const [currentPrice, setCurrentPrice] = useState("Loading...")
  const numberOfTicks = 1000
  const [allPriceList, setAllPriceList] = useState<number[]>([])
  const [activeLast, setActiveLast] = useState(0)
  const [overValue, setOverValue] = useState(5)
  const [underValue, setUnderValue] = useState(4)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isTickChart, setIsTickChart] = useState(false)
  const [pipSize, setPipSize] = useState(2)
  const [symbolsList, setSymbolsList] = useState<SymbolData[]>([])
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark"
    }
    return false
  })
  const wsRef = useRef<WebSocket | null>(null)
  const [activeDigitIndex, setActiveDigitIndex] = useState<number | null>(null)
  const digitsContainerRef = useRef<HTMLDivElement>(null)
  const [cursorPosition, setCursorPosition] = useState<number>(0)
  const [cursorRow, setCursorRow] = useState<number>(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light")
      document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light")
    }
  }, [isDarkMode])

  useEffect(() => {
    if (activeLast !== null && digitsContainerRef.current) {
      const digitBalls = digitsContainerRef.current.querySelectorAll(".progress")
      const activeBall = digitBalls[activeLast] as HTMLElement

      if (activeBall) {
        const containerRect = digitsContainerRef.current.getBoundingClientRect()
        const ballRect = activeBall.getBoundingClientRect()
        const relativeLeft = ballRect.left - containerRect.left + ballRect.width / 2
        setCursorPosition(relativeLeft)

        const row = Math.floor(activeLast / 5)
        setCursorRow(row)
      }
    }
    setActiveDigitIndex(activeLast)
  }, [activeLast])

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (activeSymbol && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          forget_all: "ticks",
        }),
      )
      setTimeout(() => {
        wsRef.current?.send(
          JSON.stringify({
            ticks_history: activeSymbol,
            count: 5000,
            end: "latest",
            style: "ticks",
            adjust_start_time: 1,
            start: 1,
          }),
        )
      }, 100)
    }
  }, [activeSymbol])

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089")
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          active_symbols: "brief",
          product_type: "basic",
        }),
      )
    }

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)

      if (data.msg_type === "active_symbols") {
        const { active_symbols } = data
        const volatilitySymbols = active_symbols.filter(
          (symbol: SymbolData) => symbol.subgroup === "synthetics" && symbol.market === "synthetic_index",
        )
        const otherSymbols = active_symbols.filter(
          (symbol: SymbolData) => symbol.subgroup === "synthetics" && symbol.market !== "synthetic_index",
        )

        volatilitySymbols.sort((a: SymbolData, b: SymbolData) => a.display_order - b.display_order)
        otherSymbols.sort((a: SymbolData, b: SymbolData) => a.display_order - b.display_order)

        const sortedSymbols = [...volatilitySymbols, ...otherSymbols]
        setSymbolsList(sortedSymbols)

        if (sortedSymbols.length > 0) {
          const symbolToUse = sortedSymbols.find((s) => s.symbol === activeSymbol)
            ? activeSymbol
            : sortedSymbols[0].symbol
          ws.send(
            JSON.stringify({
              ticks_history: symbolToUse,
              count: 5000,
              end: "latest",
              style: "ticks",
              adjust_start_time: 1,
              start: 1,
            }),
          )
        }
      }

      if (data.msg_type === "history") {
        const { history, pip_size } = data
        setPipSize(pip_size)
        const { prices } = history
        const { ticks_history } = data.echo_req

        const priceList = prices.map((p: string) => Number.parseFloat(p))
        setAllPriceList(priceList)
        setActiveSymbol(ticks_history)

        if (priceList.length > 0) {
          const lastPrice = priceList[priceList.length - 1]
          setCurrentPrice(lastPrice.toFixed(pip_size))
          setActiveLast(getLastDigit(lastPrice, pip_size))
        }

        ws.send(
          JSON.stringify({
            ticks: ticks_history,
            subscribe: 1,
          }),
        )
      }

      if (data.msg_type === "tick") {
        const { tick } = data
        const { ask, pip_size } = tick
        const price = Number.parseFloat(ask)
        setCurrentPrice(price.toFixed(pip_size))
        setActiveLast(getLastDigit(price, pip_size))
        setAllPriceList((prev) => [...prev.slice(1), price])
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
  }

  const getLastDigit = (tick: number, pip: number) => {
    const lastDigit = tick.toFixed(pip)
    return Number.parseInt(String(lastDigit).slice(-1))
  }

  const handleSync = () => {
    setIsSyncing(true)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          forget_all: "ticks",
        }),
      )
      setTimeout(() => {
        wsRef.current?.send(
          JSON.stringify({
            ticks_history: activeSymbol,
            count: 5000,
            end: "latest",
            style: "ticks",
            adjust_start_time: 1,
            start: 1,
          }),
        )
      }, 100)
    }
    setTimeout(() => setIsSyncing(false), 1000)
  }

  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSymbol = e.target.value
    setCurrentPrice("Loading...")
    setActiveSymbol(newSymbol)
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedSymbol", newSymbol)
    }
  }

  const getLastDigitList = () => {
    const requiredItems = allPriceList.slice(-numberOfTicks)
    const returnedList: number[] = []
    requiredItems.forEach((tick: number) => {
      const last_digit = getLastDigit(tick, pipSize)
      returnedList.push(last_digit)
    })
    return returnedList
  }

  const calculateEvenOddPercentages = () => {
    const digits = getLastDigitList()
    let evenCount = 0
    let oddCount = 0

    digits.forEach((digit) => {
      if (digit % 2 === 0) evenCount++
      else oddCount++
    })

    const total = digits.length || 1
    return {
      evenPercentage: ((evenCount / total) * 100).toFixed(2),
      oddPercentage: ((oddCount / total) * 100).toFixed(2),
    }
  }

  const calculateRiseFallPercentages = () => {
    const digits = getLastDigitList()
    let riseCount = 0
    let fallCount = 0

    for (let i = 1; i < digits.length; i++) {
      if (digits[i] > digits[i - 1]) riseCount++
      else if (digits[i] < digits[i - 1]) fallCount++
    }

    const total = digits.length - 1 || 1
    return {
      risePercentage: ((riseCount / total) * 100).toFixed(2),
      fallPercentage: ((fallCount / total) * 100).toFixed(2),
    }
  }

  const calculateOverUnderPercentages = () => {
    const digits = getLastDigitList()
    const overCount = digits.filter((d) => d > overValue).length
    const underCount = digits.filter((d) => d < underValue).length
    const total = digits.length || 1

    return {
      overPercentage: ((overCount / total) * 100).toFixed(2),
      underPercentage: ((underCount / total) * 100).toFixed(2),
    }
  }

  const calculateDigitFrequency = () => {
    const digits = getLastDigitList()
    const frequency: Record<number, number> = {}

    for (let i = 0; i <= 9; i++) {
      frequency[i] = 0
    }

    digits.forEach((digit) => {
      frequency[digit]++
    })

    const total = digits.length || 1
    const percentages: Record<number, number> = {}

    for (let i = 0; i <= 9; i++) {
      percentages[i] = (frequency[i] / total) * 100
    }

    return percentages
  }

  const getLineChartData = () => {
    const requiredItems = allPriceList.slice(-numberOfTicks)
    const last10 = requiredItems.slice(-10)

    if (isTickChart) {
      const data: { value: number; tick: number }[] = []
      let previousTick = 0

      last10.forEach((tick: number) => {
        const tickDiff = previousTick !== 0 ? tick - previousTick : 0
        data.push({ value: Number.parseFloat(tickDiff.toFixed(2)), tick })
        previousTick = tick
      })
      return data
    } else {
      return last10.map((tick: number) => ({
        value: getLastDigit(tick, pipSize),
        tick,
      }))
    }
  }

  const evenOdd = calculateEvenOddPercentages()
  const riseFall = calculateRiseFallPercentages()
  const overUnder = calculateOverUnderPercentages()
  const digitFreq = calculateDigitFrequency()
  const lineChartData = getLineChartData()

  const frequencies = Object.entries(digitFreq).filter(([_, val]) => val > 0)
  const maxFreq = frequencies.length > 0 ? Math.max(...frequencies.map(([_, val]) => val)) : 0
  const minFreq = frequencies.length > 0 ? Math.min(...frequencies.map(([_, val]) => val)) : 0

  return (
    <div className="main_app">
      <div className="top_bar">
        <div className="symbol_price">
          <div className="active_symbol">
            <select id="symbol_options" value={activeSymbol} onChange={handleSymbolChange}>
              {symbolsList.length > 0 ? (
                symbolsList.map((option) => (
                  <option key={option.symbol} value={option.symbol}>
                    {option.display_name}
                  </option>
                ))
              ) : (
                <option value="">Loading...</option>
              )}
            </select>
          </div>
          <div className="no_of_ticks">
            <span className="tick_label">Ticks:</span>
            <span className="tick_value">{numberOfTicks}</span>
          </div>
          <div className="current_price">
            <h3>{currentPrice}</h3>
          </div>
        </div>
        <div className="controls">
          <div className="theme_toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? (
              <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </div>
          <div className="sync_btn" onClick={handleSync}>
            <svg
              className={isSyncing ? "sync_active" : ""}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="analysis_section">
        <div className="digit_diff card3">
          <div className="title_oc_trader">
            <h2 className="analysis_title">Digit Frequency</h2>
          </div>
          <div className="differs_container" ref={digitsContainerRef}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
              const percentage = digitFreq[digit]
              const isActive = digit === activeLast
              const isTop = percentage === maxFreq && percentage > 0
              const isLess = percentage === minFreq && percentage > 0

              return (
                <div
                  key={digit}
                  className={`progress ${isActive ? "active" : ""} ${isTop ? "top" : ""} ${isLess ? "less" : ""}`}
                  data-number={digit}
                >
                  <h3>{digit}</h3>
                  <h4>
                    {percentage.toFixed(2)}
                    <span>%</span>
                  </h4>
                </div>
              )
            })}
            <div
              className="digit_cursor"
              style={{
                left: `${cursorPosition}px`,
                opacity: activeDigitIndex !== null ? 1 : 0,
              }}
              data-row={cursorRow}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="analysis_section">
        <div className="pie card1">
          <div className="odd_even_info">
            <h2 className="analysis_title">Even/Odd Analysis</h2>
          </div>
          <div className="pie_container">
            <div className="pie_chart">
              <svg viewBox="0 0 200 200" className="pie_svg">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke="#4CAF50"
                  strokeWidth="60"
                  strokeDasharray={`${(Number.parseFloat(evenOdd.evenPercentage) / 100) * 502.65} 502.65`}
                  transform="rotate(-90 100 100)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke="#F44336"
                  strokeWidth="60"
                  strokeDasharray={`${(Number.parseFloat(evenOdd.oddPercentage) / 100) * 502.65} 502.65`}
                  strokeDashoffset={`-${(Number.parseFloat(evenOdd.evenPercentage) / 100) * 502.65}`}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="pie_legend">
                <div className="legend_item">
                  <span className="legend_color even_color"></span>
                  <span>Even: {evenOdd.evenPercentage}%</span>
                </div>
                <div className="legend_item">
                  <span className="legend_color odd_color"></span>
                  <span>Odd: {evenOdd.oddPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="analysis_section">
        <div className="over_under card1">
          <h2 className="analysis_title">Over/Under Comparison</h2>
          <div className="over_under_options">
            <div className="digit_inputs">
              <div className="over_digit">
                <label htmlFor="over_input">Over</label>
                <input
                  type="number"
                  id="over_input"
                  value={overValue}
                  onChange={(e) => setOverValue(Number.parseInt(e.target.value) || 5)}
                  min="0"
                  max="9"
                />
              </div>
              <div className="under_digit">
                <label htmlFor="under_input">Under</label>
                <input
                  type="number"
                  id="under_input"
                  value={underValue}
                  onChange={(e) => setUnderValue(Number.parseInt(e.target.value) || 4)}
                  min="0"
                  max="9"
                />
              </div>
            </div>
          </div>
          <div className="bar_chart_container">
            <div className="bar_item">
              <div className="bar_label">Over {overValue}</div>
              <div className="bar_wrapper">
                <div className="bar over_bar" style={{ width: `${overUnder.overPercentage}%` }}>
                  <span className="bar_inner_label">{overUnder.overPercentage}%</span>
                </div>
                <span className="bar_value">{overUnder.overPercentage}%</span>
              </div>
            </div>
            <div className="bar_item">
              <div className="bar_label">Under {underValue}</div>
              <div className="bar_wrapper">
                <div className="bar under_bar" style={{ width: `${overUnder.underPercentage}%` }}>
                  <span className="bar_inner_label">{overUnder.underPercentage}%</span>
                </div>
                <span className="bar_value">{overUnder.underPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="analysis_section">
        <div className="rise_fall card1">
          <h2 className="analysis_title">Rise/Fall Analysis</h2>
          <div className="bar_chart_container">
            <div className="bar_item">
              <div className="bar_label">Rise</div>
              <div className="bar_wrapper">
                <div className="bar rise_bar" style={{ width: `${riseFall.risePercentage}%` }}>
                  <span className="bar_inner_label">{riseFall.risePercentage}%</span>
                </div>
                <span className="bar_value">{riseFall.risePercentage}%</span>
              </div>
            </div>
            <div className="bar_item">
              <div className="bar_label">Fall</div>
              <div className="bar_wrapper">
                <div className="bar fall_bar" style={{ width: `${riseFall.fallPercentage}%` }}>
                  <span className="bar_inner_label">{riseFall.fallPercentage}%</span>
                </div>
                <span className="bar_value">{riseFall.fallPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="analysis_section">
        <div className="line_chart card2">
          <div className="linechat_oct">
            <h2 className="analysis_title">{isTickChart ? "Rise/Fall Chart" : "Last Digits Chart"}</h2>
            <select name="" id="linechat_oct_options" onChange={(e) => setIsTickChart(e.target.value === "risefall")}>
              <option value="lastdigit">Last Digits Chart</option>
              <option value="risefall">Rise/Fall Chart</option>
            </select>
          </div>
          <div className="line_chart_container">
            <svg viewBox="0 0 600 200" className="line_svg">
              <defs>
                <pattern id="grid" width="50" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 20" fill="none" stroke="var(--grid-color)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="600" height="200" fill="url(#grid)" />

              <line x1="50" y1="180" x2="550" y2="180" stroke="var(--axis-color)" strokeWidth="2" />
              <line x1="50" y1="20" x2="50" y2="180" stroke="var(--axis-color)" strokeWidth="2" />

              {lineChartData.map((item, index) => {
                if (index === 0) return null
                const prevItem = lineChartData[index - 1]
                const x1 = 50 + ((index - 1) * 500) / (lineChartData.length - 1)
                const y1 = isTickChart ? 100 - prevItem.value * 5 : 180 - prevItem.value * 16
                const x2 = 50 + (index * 500) / (lineChartData.length - 1)
                const y2 = isTickChart ? 100 - item.value * 5 : 180 - item.value * 16

                const isRise = item.value > (prevItem?.value || 0)

                return (
                  <g key={index}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--chart-line-color)" strokeWidth="2" />
                    <circle cx={x2} cy={y2} r="4" fill="var(--chart-line-color)" />
                    <text
                      x={x2}
                      y={y2 - 10}
                      textAnchor="middle"
                      fill={isRise ? "#00a79e" : "#cc2e3d"}
                      fontSize="12"
                      fontWeight="600"
                    >
                      {item.value}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Advanced
