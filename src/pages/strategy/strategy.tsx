
"use client";
import React, { useState } from 'react';
import './strategy.css';

const Trade = () => {
    const [activeStrategy, setActiveStrategy] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);

    const strategies = {
        overUnder: {
            title: "Over/Under",
            description: "Predict if price will finish above or below target",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="M18 7V3"></path>
                    <path d="M15 15l3-3 3 3"></path>
                    <path d="M18 21v-4"></path>
                    <path d="M9 9l3-3 3 3"></path>
                    <path d="M12 21v-4"></path>
                </svg>
            ),
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            accentColor: "#4facfe",
            bgPattern: "diagonal-lines",
            tips: [
                <div className="tip-content">
                    <div className="warning-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>Requires automated tools - Not for manual trading!</span>
                    </div>

                    <div className="tip-section">
                        <h4>Requirements</h4>
                        <ul className="diamond-list">
                            <li>Use 1 tick duration</li>
                            <li>Apply volatility: 100 / 75 / 50</li>
                            <li>1s interval between entries</li>
                            <li>Use rapid execution tools</li>
                        </ul>
                    </div>

                    <div className="tip-section">
                        <h4>Trading Even</h4>
                        <ul className="checkmark-list">
                            <li>Green bar at EVEN digit (≥ 12.5%)</li>
                            <li>At least three EVEN digits above 10.5%</li>
                            <li>Red bar on EVEN digit below 9.5%</li>
                        </ul>
                        <div className="entry-point">
                            <span>ENTRY:</span> Wait for two ODD digits, then GREEN bar on EVEN
                        </div>
                    </div>

                    <div className="tip-section">
                        <h4>Trading Odd</h4>
                        <ul className="checkmark-list">
                            <li>Green bar at ODD digit (≥ 12.5%)</li>
                            <li>At least three ODD digits above 10.5%</li>
                            <li>Red bar on ODD digit below 9.5%</li>
                        </ul>
                        <div className="entry-point">
                            <span>ENTRY:</span> Wait for two EVEN digits, then GREEN bar on ODD
                        </div>
                    </div>

                    <div className="pro-tip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                        <div>
                            <strong>PRO TIP:</strong> Patience is key! Never rush the market – wait for perfect conditions.
                        </div>
                    </div>
                </div>
            ]
        },
        evenOdd: {
            title: "Even/Odd",
            description: "Forecast whether the final digit will be even or odd",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v4"></path>
                    <path d="M16 3v4"></path>
                    <path d="M3 10h18"></path>
                    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                    <path d="M9 16l2 2 4-4"></path>
                </svg>
            ),
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            accentColor: "#f5576c",
            bgPattern: "polka-dots",
            tips: [
                <div className="tip-content">
                    <div className="warning-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>Requires automated tools - Not for manual trading!</span>
                    </div>

                    <div className="tip-section">
                        <h4>Requirements</h4>
                        <ul className="diamond-list">
                            <li>Use 1 tick duration</li>
                            <li>Apply volatility: 100/75/50 with 1s intervals</li>
                            <li>Utilize rapid execution tools</li>
                        </ul>
                    </div>

                    <div className="tip-section">
                        <h4>Trading Even</h4>
                        <ul className="checkmark-list">
                            <li>Green bar at EVEN digit (12.5%+)</li>
                            <li>Three EVEN digits above 10.5%</li>
                            <li>Red bar on EVEN digit below 9.5%</li>
                        </ul>
                        <div className="entry-point">
                            <span>ENTRY:</span> Wait for cursor to hit TWO ODD digits then GREEN BAR
                        </div>
                    </div>

                    <div className="tip-section">
                        <h4>Trading Odd</h4>
                        <ul className="checkmark-list">
                            <li>Green bar at ODD digit (12.5%+)</li>
                            <li>Three ODD digits above 10.5%</li>
                            <li>Red bar on ODD digit below 9.5%</li>
                        </ul>
                        <div className="entry-point">
                            <span>ENTRY:</span> Wait for cursor to hit TWO EVEN digits then GREEN BAR
                        </div>
                    </div>

                    <div className="pro-tip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                        <div>
                            <strong>PRO TIP:</strong> Patience is key! Never rush the market - wait for perfect conditions
                        </div>
                    </div>
                </div>
            ]
        },
        matchesDiffers: {
            title: "Matches/Differs",
            description: "Capitalize on sustained market movements",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
            ),
            gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            accentColor: "#43e97b",
            bgPattern: "waves",
            tips: [
                <div className="tip-content">
                    <div className="warning-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>Requires automated tools - Not for manual trading!</span>
                    </div>

                    <div className="tip-section">
                        <h4>Requirements</h4>
                        <ul className="diamond-list">
                            <li>Use 1 tick duration</li>
                            <li>Apply volatility: 100 / 75 / 50</li>
                            <li>1s interval between entries</li>
                            <li>Use rapid execution tools</li>
                        </ul>
                    </div>

                    <div className="tip-section">
                        <h4>Trading Matches</h4>
                        <ul className="checkmark-list">
                            <li>Digit with highest probability is consistently repeated</li>
                            <li>Green bar on that digit is ≥ 14%</li>
                            <li>No red bars on the same digit within last 3 ticks</li>
                        </ul>
                        <div className="entry-point">
                            <span>ENTRY:</span> When a single digit dominates recent results and shows GREEN bar ≥ 14%
                        </div>
                    </div>

                    <div className="tip-section">
                        <h4>Trading Differs</h4>
                        <ul className="checkmark-list">
                            <li>Target digit has low probability (≤ 6%)</li>
                            <li>No repeating pattern or domination by a single digit</li>
                            <li>Red bar appears frequently on the same digit</li>
                        </ul>
                        <div className="entry-point">
                            <span>ENTRY:</span> When no digit is repeated and a target digit is marked RED (≤ 6%)
                        </div>
                    </div>

                    <div className="pro-tip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                        <div>
                            <strong>PRO TIP:</strong> Use Matches during consolidation and Differs during volatility for better precision.
                        </div>
                    </div>
                </div>
            ]
        },
        breakout: {
            title: "Breakout",
            description: "Trade price movements beyond key levels",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18"></path>
                    <path d="M6 6l12 12"></path>
                </svg>
            ),
            gradient: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
            accentColor: "#ff9a9e",
            bgPattern: "grid",
            tips: [
                <div className="tip-content">
                    <div className="warning-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>Requires automated tools - Not for manual trading!</span>
                    </div>

                    <div className="tip-section">
                        <h4>Requirements</h4>
                        <ul className="diamond-list">
                            <li>5s or 10s duration</li>
                            <li>Volatility 100 or Step Index</li>
                            <li>Support/resistance detection or custom zone logic</li>
                        </ul>
                    </div>

                    <div className="tip-section">
                        <h4>Breakout Setup</h4>
                        <ul className="checkmark-list">
                            <li>Price consolidates in a tight range (2–3 ticks)</li>
                            <li>Sudden spike in tick volume or volatility bar</li>
                            <li>Breaks previous high or low with momentum</li>
                        </ul>
                        <div className="entry-point">
                            <span>ENTRY:</span> Enter trade on breakout **after confirming momentum bar** and no pullback
                        </div>
                    </div>

                    <div className="pro-tip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                        <div>
                            <strong>PRO TIP:</strong> Avoid trading breakouts in ranging markets — wait for buildup and compression!
                        </div>
                    </div>
                </div>
            ]
        },
        scalping: {
            title: "Scalping",
            description: "Quick trades capturing small price movements",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            ),
            gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
            accentColor: "#a18cd1",
            bgPattern: "hexagons",
            tips: [
                <div className="tip-content">
                    <div className="warning-banner">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>Requires automated tools - Not for manual trading!</span>
                    </div>

                    <div className="tip-section">
                        <h4>Requirements</h4>
                        <ul className="diamond-list">
                            <li>1 tick or 2s duration</li>
                            <li>Volatility 75 or 50</li>
                            <li>Fast chart with live tick feed</li>
                        </ul>
                    </div>

                    <div className="tip-section">
                        <h4>Scalping Setup</h4>
                        <ul className="checkmark-list">
                            <li>High frequency of green bars in 3–5 ticks</li>
                            <li>Bar momentum favors one direction (e.g., 4 green vs 1 red)</li>
                            <li>Minimal delay between bars</li>
                        </ul>
                        <div className="entry-point">
                            <span>ENTRY:</span> Enter immediately **after 3 consecutive green/red ticks** in same direction
                        </div>
                    </div>

                    <div className="pro-tip">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                        <div>
                            <strong>PRO TIP:</strong> Scalping requires speed — reduce latency and avoid high ping environments.
                        </div>
                    </div>
                </div>
            ]
        }
    };

    const handleBackClick = () => {
        setActiveStrategy(null);
    };

    return (
        <div className="trade-container">
            {!activeStrategy ? (
                <div className="strategies-container">
                    <div className="background-elements">
                        <div className="bg-circle blue"></div>
                        <div className="bg-circle pink"></div>
                        <div className="bg-circle green"></div>
                    </div>

                    <h1 className="strategies-title">
                        Advanced Trading Strategies
                    </h1>

                    <p className="strategies-subtitle">
                        Select a trading strategy to view detailed execution guidelines
                    </p>

                    <div className="strategy-cards-container">
                        {Object.entries(strategies).map(([key, strategy]) => (
                            <div
                                key={key}
                                onClick={() => setActiveStrategy(key)}
                                onMouseEnter={() => setHoveredCard(key)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className={`strategy-card ${strategy.bgPattern} ${hoveredCard === key ? 'hovered' : ''}`}
                                style={{
                                    '--accent-color': strategy.accentColor,
                                    '--gradient': strategy.gradient
                                }}
                            >
                                <div className="card-glow" style={{ background: strategy.gradient }}></div>
                                <div className="card-content">
                                    <div className="card-icon" style={{ background: strategy.gradient }}>
                                        {strategy.icon}
                                    <
