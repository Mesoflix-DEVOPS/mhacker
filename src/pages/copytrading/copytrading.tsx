'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './CopyTradingPage.module.scss';

interface ResponseData {
    msg_type?: string;
    error?: {
        message: string;
    };
    authorize?: {
        loginid: string;
    };
    [key: string]: any;
}

const CopyTradingPage = () => {
    const [copierToken, setCopierToken] = useState('');
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'controls' | 'response'>('controls');
    const wsRef = useRef<WebSocket | null>(null);

    // Hidden trader token
    const TRADER_TOKEN = 'WTbty6OPvswbdYz';

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = (onOpenCallback?: () => void) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            onOpenCallback?.();
            return;
        }

        wsRef.current = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=70344');

        wsRef.current.onopen = () => {
            setIsConnected(true);
            if (copierToken.trim()) {
                wsRef.current?.send(JSON.stringify({ authorize: copierToken.trim() }));
            }
            onOpenCallback?.();
        };

        wsRef.current.onclose = () => setIsConnected(false);

        wsRef.current.onmessage = (event) => {
            const data: ResponseData = JSON.parse(event.data);
            setResponse(data);

            if (data.msg_type === 'authorize' && data.error) {
                alert('Authorization failed: ' + data.error.message);
            }

            if (data.msg_type === 'copy_start' && data.error) {
                alert('Copy start error: ' + data.error.message);
            }

            if (data.msg_type === 'copy_stop' && data.error) {
                alert('Copy stop error: ' + data.error.message);
            }

            if (data.msg_type === 'set_settings') {
                if (!data.error) {
                    console.log('Copy trading permission enabled.');
                } else {
                    console.error('Failed to enable copy trading:', data.error.message);
                }
            }
        };
    };

    const authorizeAndEnableCopying = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            const traderWs = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=70344');

            traderWs.onopen = () => {
                traderWs.send(JSON.stringify({ authorize: TRADER_TOKEN }));
            };

            traderWs.onmessage = (event) => {
                const data: ResponseData = JSON.parse(event.data);
                if (data.msg_type === 'authorize' && data.authorize?.loginid) {
                    traderWs.send(JSON.stringify({ set_settings: 1, copytrading_allowed: 1 }));
                } else if (data.msg_type === 'set_settings') {
                    traderWs.close();
                    resolve();
                } else if (data.error) {
                    alert('Error enabling copy trading: ' + data.error.message);
                    traderWs.close();
                    reject();
                }
            };
        });
    };

    const fetchTraderLoginId = async (): Promise<string | null> => {
        return new Promise((resolve) => {
            const tempWs = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=70344');

            tempWs.onopen = () => {
                tempWs.send(JSON.stringify({ authorize: TRADER_TOKEN }));
            };

            tempWs.onmessage = (event) => {
                const data: ResponseData = JSON.parse(event.data);
                if (data.msg_type === 'authorize' && data.authorize?.loginid) {
                    resolve(data.authorize.loginid);
                    tempWs.close();
                } else if (data.error) {
                    alert('Failed to fetch trader login ID: ' + data.error.message);
                    resolve(null);
                    tempWs.close();
                }
            };
        });
    };

    const startCopyTrading = async () => {
        if (!copierToken.trim()) {
            alert('Copier token is required.');
            return;
        }

        setIsLoading(true);
        try {
            await authorizeAndEnableCopying();

            connectWebSocket(() => {
                const request = {
                    copy_start: TRADER_TOKEN,
                    req_id: Date.now(),
                };
                wsRef.current?.send(JSON.stringify(request));
            });
        } catch {
            // Error handled in authorizeAndEnableCopying
        } finally {
            setIsLoading(false);
        }
    };

    const stopCopyTrading = async () => {
        setIsLoading(true);
        try {
            const traderLoginId = await fetchTraderLoginId();
            if (!copierToken.trim() || !traderLoginId) {
                alert('Copier token and trader ID are required.');
                return;
            }

            connectWebSocket(() => {
                const request = {
                    copy_stop: 1,
                    trader_loginid: traderLoginId,
                    req_id: Date.now(),
                };
                wsRef.current?.send(JSON.stringify(request));
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1>Copy Trading Dashboard</h1>
                        <div className={styles.connectionStatus}>
                            <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}></div>
                            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                    </div>
                    <p className={styles.subtitle}>Automatically copy trades from our expert trader</p>
                </div>

                {/* Main Content */}
                <div className={styles.content}>
                    {/* Tabs */}
                    <div className={styles.tabs}>
                        <button
                            onClick={() => setActiveTab('controls')}
                            className={`${styles.tabButton} ${activeTab === 'controls' ? styles.activeTab : ''}`}
                        >
                            Trading Controls
                        </button>
                        <button
                            onClick={() => setActiveTab('response')}
                            className={`${styles.tabButton} ${activeTab === 'response' ? styles.activeTab : ''}`}
                        >
                            API Response
                        </button>
                    </div>

                    {/* Controls Tab */}
                    {activeTab === 'controls' && (
                        <div className={styles.controlsContainer}>
                            <div className={styles.section}>
                                <h2>Account Setup</h2>
                                <div className={styles.formGroup}>
                                    <label>
                                        Your API Token
                                    </label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        placeholder="Enter your Deriv API token"
                                        value={copierToken}
                                        onChange={(e) => setCopierToken(e.target.value)}
                                    />
                                    <p className={styles.helperText}>
                                        This token authenticates your account for copy trading
                                    </p>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h2>Trading Actions</h2>
                                <div className={styles.actionButtons}>
                                    <button
                                        onClick={startCopyTrading}
                                        disabled={isLoading}
                                        className={`${styles.button} ${styles.primaryButton}`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className={styles.spinner}></div>
                                                Starting...
                                            </>
                                        ) : (
                                            'Start Copy Trading'
                                        )}
                                    </button>
                                    <button
                                        onClick={stopCopyTrading}
                                        disabled={isLoading}
                                        className={`${styles.button} ${styles.dangerButton}`}
                                    >
                                        Stop Copy Trading
                                    </button>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h2>Connection Status</h2>
                                <div className={styles.statusGrid}>
                                    <div className={styles.statusCard}>
                                        <div className={styles.statusRow}>
                                            <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}></div>
                                            <span>WebSocket</span>
                                        </div>
                                        <p>
                                            {isConnected ? 'Connected to trading server' : 'Disconnected from trading server'}
                                        </p>
                                    </div>
                                    <div className={styles.statusCard}>
                                        <div className={styles.statusRow}>
                                            <div className={`${styles.statusIndicator} ${copierToken ? styles.connected : styles.warning}`}></div>
                                            <span>Account Auth</span>
                                        </div>
                                        <p>
                                            {copierToken ? 'Token provided' : 'No token provided'}
                                        </p>
                                    </div>
                                    <div className={styles.statusCard}>
                                        <div className={styles.statusRow}>
                                            <div className={`${styles.statusIndicator} ${styles.connected}`}></div>
                                            <span>Trader Ready</span>
                                        </div>
                                        <p>
                                            Expert trader configured
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Response Tab */}
                    {activeTab === 'response' && response && (
                        <div className={styles.responseContainer}>
                            <h2>API Response</h2>
                            <pre className={styles.responseContent}>
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <p>Copy Trading Dashboard • Use with caution • Not financial advice</p>
                </div>
            </div>
        </div>
    );
};

export default CopyTradingPage;
