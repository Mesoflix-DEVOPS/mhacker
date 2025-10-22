"use client"

import { useState, useRef, useEffect } from "react"
import styles from "./copytradingpage.module.scss"

interface Account {
  loginid: string
  token: string
  currency: string
  balance?: number
  accountType?: string
}

interface Follower {
  loginid: string
  token: string
  status: "connected" | "syncing" | "disconnected"
  balance?: number
  lastSync?: string
}

interface ResponseData {
  msg_type?: string
  error?: {
    message: string
  }
  authorize?: {
    loginid: string
    balance?: number
    account_type?: string
  }
  balance?: {
    balance: number
  }
  [key: string]: any
}

const CopyTradingPage = () => {
  // Role and Mode States
  const [userRole, setUserRole] = useState<"trader" | "follower" | null>(null)
  const [demoToRealMode, setDemoToRealMode] = useState(false)
  const [isCopyingActive, setIsCopyingActive] = useState(false)

  // Account States
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccount, setActiveAccount] = useState<Account | null>(null)
  const [accountBalance, setAccountBalance] = useState<number | null>(null)

  // Follower Management (Trader Mode)
  const [followers, setFollowers] = useState<Follower[]>([])
  const [newFollowerToken, setNewFollowerToken] = useState("")

  // Trader Connection (Follower Mode)
  const [traderToken, setTraderToken] = useState("")

  // UI States
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "followers" | "settings" | "response">("overview")
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(
    null,
  )

  const wsRef = useRef<WebSocket | null>(null)
  const balanceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("copytrading_role") as "trader" | "follower" | null
    const savedDemoMode = localStorage.getItem("copytrading_demo_mode") === "true"
    const savedCopyingActive = localStorage.getItem("copytrading_active") === "true"
    const savedFollowers = localStorage.getItem("copytrading_followers")

    if (savedRole) setUserRole(savedRole)
    setDemoToRealMode(savedDemoMode)
    setIsCopyingActive(savedCopyingActive)
    if (savedFollowers) setFollowers(JSON.parse(savedFollowers))

    // Load accounts from localStorage (set by callback)
    const clientAccounts = localStorage.getItem("clientAccounts")
    if (clientAccounts) {
      const parsed = JSON.parse(clientAccounts)
      const accountsArray = Object.values(parsed) as Account[]
      setAccounts(accountsArray)
      if (accountsArray.length > 0) {
        setActiveAccount(accountsArray[0])
      }
    }

    return () => {
      if (balanceCheckIntervalRef.current) {
        clearInterval(balanceCheckIntervalRef.current)
      }
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    if (userRole) localStorage.setItem("copytrading_role", userRole)
  }, [userRole])

  useEffect(() => {
    localStorage.setItem("copytrading_demo_mode", demoToRealMode.toString())
  }, [demoToRealMode])

  useEffect(() => {
    localStorage.setItem("copytrading_active", isCopyingActive.toString())
  }, [isCopyingActive])

  useEffect(() => {
    localStorage.setItem("copytrading_followers", JSON.stringify(followers))
  }, [followers])

  // WebSocket Connection
  const connectWebSocket = (token: string, onOpenCallback?: () => void) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      onOpenCallback?.()
      return
    }

    wsRef.current = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=70344")

    wsRef.current.onopen = () => {
      setIsConnected(true)
      wsRef.current?.send(JSON.stringify({ authorize: token }))
      onOpenCallback?.()
    }

    wsRef.current.onclose = () => {
      setIsConnected(false)
      showNotification("warning", "Connection lost. Attempting to reconnect...")
    }

    wsRef.current.onerror = () => {
      showNotification("error", "WebSocket connection error")
    }

    wsRef.current.onmessage = (event) => {
      const data: ResponseData = JSON.parse(event.data)
      setResponse(data)

      if (data.msg_type === "authorize") {
        if (data.error) {
          showNotification("error", `Authorization failed: ${data.error.message}`)
        } else {
          showNotification("success", "Account authorized successfully")
          if (data.authorize?.balance !== undefined) {
            setAccountBalance(data.authorize.balance)
          }
        }
      }

      if (data.msg_type === "balance" && data.balance) {
        setAccountBalance(data.balance.balance)
      }

      if (data.msg_type === "copy_start" && !data.error) {
        setIsCopyingActive(true)
        showNotification("success", "Copy trading started")
      }

      if (data.msg_type === "copy_stop" && !data.error) {
        setIsCopyingActive(false)
        showNotification("success", "Copy trading stopped")
      }
    }
  }

  // Fetch Balance
  const fetchBalance = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ balance: 1, req_id: Date.now() }))
    }
  }

  // Show Notification
  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  // Trader Mode: Add Follower
  const addFollower = async () => {
    if (!newFollowerToken.trim()) {
      showNotification("error", "Please enter a follower token")
      return
    }

    setIsLoading(true)
    try {
      // Validate token
      const tempWs = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=70344")
      await new Promise((resolve, reject) => {
        tempWs.onopen = () => {
          tempWs.send(JSON.stringify({ authorize: newFollowerToken.trim() }))
        }

        tempWs.onmessage = (event) => {
          const data: ResponseData = JSON.parse(event.data)
          if (data.msg_type === "authorize") {
            if (data.error) {
              reject(new Error(data.error.message))
            } else {
              const newFollower: Follower = {
                loginid: data.authorize?.loginid || "Unknown",
                token: newFollowerToken.trim(),
                status: "connected",
                balance: data.authorize?.balance,
                lastSync: new Date().toISOString(),
              }
              setFollowers([...followers, newFollower])
              setNewFollowerToken("")
              showNotification("success", `Follower ${newFollower.loginid} added successfully`)
              resolve(null)
            }
            tempWs.close()
          }
        }

        tempWs.onerror = () => reject(new Error("Token validation failed"))
      })
    } catch (error) {
      showNotification("error", `Failed to add follower: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Trader Mode: Remove Follower
  const removeFollower = (loginid: string) => {
    if (confirm(`Remove follower ${loginid}?`)) {
      setFollowers(followers.filter((f) => f.loginid !== loginid))
      showNotification("success", "Follower removed")
    }
  }

  // Start Copy Trading
  const startCopyTrading = async () => {
    if (!activeAccount) {
      showNotification("error", "No active account selected")
      return
    }

    if (userRole === "follower" && !traderToken.trim()) {
      showNotification("error", "Please enter trader token")
      return
    }

    if (demoToRealMode) {
      const confirmed = confirm(
        "⚠️ WARNING: You are about to enable Demo-to-Real copy mode. This will mirror trades to your REAL account. Continue?",
      )
      if (!confirmed) return
    }

    setIsLoading(true)
    try {
      connectWebSocket(activeAccount.token, () => {
        const request = {
          copy_start: userRole === "trader" ? activeAccount.loginid : traderToken.trim(),
          req_id: Date.now(),
        }
        wsRef.current?.send(JSON.stringify(request))
      })

      // Start balance check interval
      if (balanceCheckIntervalRef.current) clearInterval(balanceCheckIntervalRef.current)
      balanceCheckIntervalRef.current = setInterval(fetchBalance, 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Stop Copy Trading
  const stopCopyTrading = async () => {
    if (!activeAccount) return

    setIsLoading(true)
    try {
      connectWebSocket(activeAccount.token, () => {
        const request = {
          copy_stop: 1,
          trader_loginid: userRole === "trader" ? activeAccount.loginid : traderToken.trim(),
          req_id: Date.now(),
        }
        wsRef.current?.send(JSON.stringify(request))
      })

      if (balanceCheckIntervalRef.current) clearInterval(balanceCheckIntervalRef.current)
    } finally {
      setIsLoading(false)
    }
  }

  // Role Selection Screen
  if (!userRole) {
    return (
      <div className={styles.container}>
        <div className={styles.roleSelectionCard}>
          <div className={styles.roleHeader}>
            <h1>Mesoflix Copy Trading</h1>
            <p>Select your role to get started</p>
          </div>

          <div className={styles.roleGrid}>
            <div className={styles.roleOption} onClick={() => setUserRole("trader")}>
              <div className={styles.roleIcon}>👨‍💼</div>
              <h2>Trader Mode</h2>
              <p>Broadcast your trades to followers</p>
              <ul className={styles.roleFeatures}>
                <li>✓ Manage multiple followers</li>
                <li>✓ Real-time trade broadcasting</li>
                <li>✓ Monitor follower activity</li>
              </ul>
            </div>

            <div className={styles.roleOption} onClick={() => setUserRole("follower")}>
              <div className={styles.roleIcon}>📊</div>
              <h2>Follower Mode</h2>
              <p>Copy trades from expert traders</p>
              <ul className={styles.roleFeatures}>
                <li>✓ Automatic trade mirroring</li>
                <li>✓ Demo-to-Real mode</li>
                <li>✓ Real-time synchronization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Notification */}
      {notification && (
        <div className={`${styles.notification} ${styles[`notification-${notification.type}`]}`}>
          {notification.message}
        </div>
      )}

      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1>Copy Trading Dashboard</h1>
              <p className={styles.roleLabel}>{userRole === "trader" ? "👨‍💼 Trader Mode" : "📊 Follower Mode"}</p>
            </div>
            <div className={styles.connectionStatus}>
              <div
                className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}
              ></div>
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
          <p className={styles.subtitle}>
            {userRole === "trader"
              ? "Manage followers and broadcast trades in real-time"
              : "Automatically copy trades from expert traders"}
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`${styles.tabButton} ${activeTab === "overview" ? styles.activeTab : ""}`}
          >
            Overview
          </button>
          {userRole === "trader" && (
            <button
              onClick={() => setActiveTab("followers")}
              className={`${styles.tabButton} ${activeTab === "followers" ? styles.activeTab : ""}`}
            >
              Followers ({followers.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab("settings")}
            className={`${styles.tabButton} ${activeTab === "settings" ? styles.activeTab : ""}`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("response")}
            className={`${styles.tabButton} ${activeTab === "response" ? styles.activeTab : ""}`}
          >
            API Response
          </button>
          <button onClick={() => setUserRole(null)} className={`${styles.tabButton} ${styles.switchRoleButton}`}>
            Switch Role
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className={styles.controlsContainer}>
              {/* Account Overview */}
              <div className={styles.section}>
                <h2>Account Overview</h2>
                {activeAccount ? (
                  <div className={styles.accountCard}>
                    <div className={styles.accountRow}>
                      <span className={styles.label}>Login ID:</span>
                      <span className={styles.value}>{activeAccount.loginid}</span>
                    </div>
                    <div className={styles.accountRow}>
                      <span className={styles.label}>Balance:</span>
                      <span className={styles.value}>
                        {accountBalance !== null
                          ? `${accountBalance.toFixed(2)} ${activeAccount.currency}`
                          : "Loading..."}
                      </span>
                    </div>
                    <div className={styles.accountRow}>
                      <span className={styles.label}>Currency:</span>
                      <span className={styles.value}>{activeAccount.currency}</span>
                    </div>
                    <div className={styles.accountRow}>
                      <span className={styles.label}>Copy Status:</span>
                      <span className={`${styles.value} ${isCopyingActive ? styles.active : styles.inactive}`}>
                        {isCopyingActive ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className={styles.noData}>No account available. Please authorize first.</p>
                )}
              </div>

              {/* Copy Trading Controls */}
              <div className={styles.section}>
                <h2>Copy Trading Controls</h2>
                {userRole === "follower" && (
                  <div className={styles.formGroup}>
                    <label>Trader Token</label>
                    <input
                      type="password"
                      className={styles.input}
                      placeholder="Enter trader's API token"
                      value={traderToken}
                      onChange={(e) => setTraderToken(e.target.value)}
                    />
                    <p className={styles.helperText}>Enter the token of the trader you want to copy</p>
                  </div>
                )}

                <div className={styles.actionButtons}>
                  <button
                    onClick={startCopyTrading}
                    disabled={isLoading || !activeAccount}
                    className={`${styles.button} ${styles.primaryButton}`}
                  >
                    {isLoading ? (
                      <>
                        <div className={styles.spinner}></div>
                        Starting...
                      </>
                    ) : (
                      "▶ Start Copy Trading"
                    )}
                  </button>
                  <button
                    onClick={stopCopyTrading}
                    disabled={isLoading || !isCopyingActive}
                    className={`${styles.button} ${styles.dangerButton}`}
                  >
                    ⏹ Stop Copy Trading
                  </button>
                </div>
              </div>

              {/* Status Grid */}
              <div className={styles.section}>
                <h2>Connection Status</h2>
                <div className={styles.statusGrid}>
                  <div className={styles.statusCard}>
                    <div className={styles.statusRow}>
                      <div
                        className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}
                      ></div>
                      <span>WebSocket</span>
                    </div>
                    <p>{isConnected ? "Connected to trading server" : "Disconnected"}</p>
                  </div>
                  <div className={styles.statusCard}>
                    <div className={styles.statusRow}>
                      <div
                        className={`${styles.statusIndicator} ${activeAccount ? styles.connected : styles.warning}`}
                      ></div>
                      <span>Account Auth</span>
                    </div>
                    <p>{activeAccount ? "Authorized" : "Not authorized"}</p>
                  </div>
                  <div className={styles.statusCard}>
                    <div className={styles.statusRow}>
                      <div
                        className={`${styles.statusIndicator} ${isCopyingActive ? styles.connected : styles.disconnected}`}
                      ></div>
                      <span>Copy Status</span>
                    </div>
                    <p>{isCopyingActive ? "Copying active" : "Copying inactive"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Followers Tab (Trader Mode) */}
          {activeTab === "followers" && userRole === "trader" && (
            <div className={styles.controlsContainer}>
              <div className={styles.section}>
                <h2>Add New Follower</h2>
                <div className={styles.formGroup}>
                  <label>Follower API Token</label>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="Enter follower's API token"
                    value={newFollowerToken}
                    onChange={(e) => setNewFollowerToken(e.target.value)}
                  />
                  <p className={styles.helperText}>Paste the follower's Deriv API token to add them</p>
                </div>
                <button
                  onClick={addFollower}
                  disabled={isLoading}
                  className={`${styles.button} ${styles.primaryButton}`}
                >
                  {isLoading ? "Adding..." : "+ Add Follower"}
                </button>
              </div>

              <div className={styles.section}>
                <h2>Connected Followers</h2>
                {followers.length > 0 ? (
                  <div className={styles.followersList}>
                    {followers.map((follower) => (
                      <div key={follower.loginid} className={styles.followerCard}>
                        <div className={styles.followerHeader}>
                          <div>
                            <h3>{follower.loginid}</h3>
                            <p className={styles.followerStatus}>
                              <span className={`${styles.statusIndicator} ${styles[follower.status]}`}></span>
                              {follower.status.charAt(0).toUpperCase() + follower.status.slice(1)}
                            </p>
                          </div>
                          <button onClick={() => removeFollower(follower.loginid)} className={styles.deleteButton}>
                            ✕
                          </button>
                        </div>
                        <div className={styles.followerDetails}>
                          <div>
                            <span className={styles.label}>Balance:</span>
                            <span className={styles.value}>{follower.balance?.toFixed(2) || "N/A"}</span>
                          </div>
                          <div>
                            <span className={styles.label}>Last Sync:</span>
                            <span className={styles.value}>
                              {follower.lastSync ? new Date(follower.lastSync).toLocaleTimeString() : "Never"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>No followers connected yet. Add one to get started!</p>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className={styles.controlsContainer}>
              <div className={styles.section}>
                <h2>Copy Trading Settings</h2>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <h3>Demo-to-Real Mode</h3>
                    <p>Mirror trades from demo to real account</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={demoToRealMode}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const confirmed = confirm(
                            "⚠️ WARNING: Enabling Demo-to-Real mode will mirror trades to your REAL account. This involves real money. Continue?",
                          )
                          if (confirmed) setDemoToRealMode(true)
                        } else {
                          setDemoToRealMode(false)
                        }
                      }}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <h3>Auto-Reconnect</h3>
                    <p>Automatically reconnect on connection loss</p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.section}>
                <h2>Account Management</h2>
                <div className={styles.accountsList}>
                  {accounts.map((account) => (
                    <div
                      key={account.loginid}
                      className={`${styles.accountItem} ${activeAccount?.loginid === account.loginid ? styles.active : ""}`}
                      onClick={() => setActiveAccount(account)}
                    >
                      <div className={styles.accountItemContent}>
                        <h4>{account.loginid}</h4>
                        <p>{account.currency}</p>
                      </div>
                      {activeAccount?.loginid === account.loginid && <span className={styles.checkmark}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Response Tab */}
          {activeTab === "response" && response && (
            <div className={styles.responseContainer}>
              <h2>API Response</h2>
              <pre className={styles.responseContent}>{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>Mesoflix Copy Trading • Use with caution • Not financial advice</p>
        </div>
      </div>
    </div>
  )
}

export default CopyTradingPage
