"use client"

import { useState, useRef, useEffect } from "react"
import styles from "./CopyTradingPage.module.scss"

interface Account {
  loginid: string
  token: string
  currency: string
  balance?: number
  accountType?: string
  name?: string
  realName?: string
}

interface Wallet {
  id: string
  name: string
  balance: number
  type: "demo" | "real"
}

interface Follower {
  loginid: string
  token: string
  name?: string
  realName?: string
  status: "connected" | "syncing" | "disconnected"
  balance?: number
  lastSync?: string
  selectedWallet?: string
  copyMode?: "demo-to-demo" | "demo-to-real"
  wallets?: Wallet[]
}

interface Trader {
  loginid: string
  token: string
  name?: string
  realName?: string
  copyMode: "demo-to-demo" | "demo-to-real"
  selectedWallet?: string
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
  const [copyMode, setCopyMode] = useState<"demo-to-demo" | "demo-to-real">("demo-to-demo")

  // Account States
  const [accounts, setAccounts] = useState<Account[]>([])
  const [activeAccount, setActiveAccount] = useState<Account | null>(null)
  const [accountBalance, setAccountBalance] = useState<number | null>(null)
  const [accountName, setAccountName] = useState<string>("")
  const [accountRealName, setAccountRealName] = useState<string>("")
  const [userWallets, setUserWallets] = useState<Wallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string>("")

  // Follower Management (Trader Mode)
  const [followers, setFollowers] = useState<Follower[]>([])
  const [newFollowerToken, setNewFollowerToken] = useState("")
  const [newFollowerName, setNewFollowerName] = useState("")

  // Trader Connection (Follower Mode)
  const [traderToken, setTraderToken] = useState("")
  const [traderName, setTraderName] = useState("")
  const [traderRealName, setTraderRealName] = useState("")
  const [traderCopyMode, setTraderCopyMode] = useState<"demo-to-demo" | "demo-to-real">("demo-to-demo")

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
    const savedCopyMode =
      (localStorage.getItem("copytrading_copy_mode") as "demo-to-demo" | "demo-to-real") || "demo-to-demo"
    const savedDemoMode = localStorage.getItem("copytrading_demo_mode") === "true"
    const savedCopyingActive = localStorage.getItem("copytrading_active") === "true"
    const savedFollowers = localStorage.getItem("copytrading_followers")
    const savedAccountName = localStorage.getItem("copytrading_account_name")
    const savedAccountRealName = localStorage.getItem("copytrading_account_real_name")
    const savedWallets = localStorage.getItem("copytrading_wallets")
    const savedSelectedWallet = localStorage.getItem("copytrading_selected_wallet")

    if (savedRole) setUserRole(savedRole)
    setCopyMode(savedCopyMode)
    setDemoToRealMode(savedDemoMode)
    setIsCopyingActive(savedCopyingActive)
    if (savedFollowers) setFollowers(JSON.parse(savedFollowers))
    if (savedAccountName) setAccountName(savedAccountName)
    if (savedAccountRealName) setAccountRealName(savedAccountRealName)
    if (savedWallets) setUserWallets(JSON.parse(savedWallets))
    if (savedSelectedWallet) setSelectedWallet(savedSelectedWallet)

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
    localStorage.setItem("copytrading_copy_mode", copyMode)
  }, [copyMode])

  useEffect(() => {
    localStorage.setItem("copytrading_demo_mode", demoToRealMode.toString())
  }, [demoToRealMode])

  useEffect(() => {
    localStorage.setItem("copytrading_active", isCopyingActive.toString())
  }, [isCopyingActive])

  useEffect(() => {
    localStorage.setItem("copytrading_followers", JSON.stringify(followers))
  }, [followers])

  useEffect(() => {
    localStorage.setItem("copytrading_account_name", accountName)
  }, [accountName])

  useEffect(() => {
    localStorage.setItem("copytrading_account_real_name", accountRealName)
  }, [accountRealName])

  useEffect(() => {
    localStorage.setItem("copytrading_wallets", JSON.stringify(userWallets))
  }, [userWallets])

  useEffect(() => {
    localStorage.setItem("copytrading_selected_wallet", selectedWallet)
  }, [selectedWallet])

  const connectWebSocket = (token: string, onOpenCallback?: () => void) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      onOpenCallback?.()
      return
    }

    if (wsRef.current) {
      wsRef.current.close()
    }

    wsRef.current = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=70344")
    let isAuthorized = false

    wsRef.current.onopen = () => {
      console.log("[v0] WebSocket opened, sending authorization...")
      wsRef.current?.send(JSON.stringify({ authorize: token }))
    }

    wsRef.current.onclose = () => {
      console.log("[v0] WebSocket closed")
      setIsConnected(false)
      setTimeout(() => {
        if (!isAuthorized) {
          console.log("[v0] Attempting to reconnect...")
          connectWebSocket(token, onOpenCallback)
        }
      }, 3000)
    }

    wsRef.current.onerror = (error) => {
      console.error("[v0] WebSocket error:", error)
      showNotification("error", "WebSocket connection error")
    }

    wsRef.current.onmessage = (event) => {
      try {
        const data: ResponseData = JSON.parse(event.data)
        console.log("[v0] WebSocket message received:", data.msg_type)
        setResponse(data)

        if (data.msg_type === "authorize") {
          if (data.error) {
            console.error("[v0] Authorization error:", data.error.message)
            showNotification("error", `Authorization failed: ${data.error.message}`)
            wsRef.current?.close()
          } else {
            isAuthorized = true
            setIsConnected(true)
            console.log("[v0] Authorization successful")
            showNotification("success", "Account authorized successfully")

            if (data.authorize?.loginid) {
              setAccountName(data.authorize.loginid)
              const storedRealName = localStorage.getItem(`realname_${data.authorize.loginid}`)
              if (storedRealName) {
                setAccountRealName(storedRealName)
              }
            }
            if (data.authorize?.balance !== undefined) {
              setAccountBalance(data.authorize.balance)
            }

            setTimeout(() => {
              console.log("[v0] Requesting balance...")
              wsRef.current?.send(JSON.stringify({ balance: 1, req_id: Date.now() }))
            }, 50)

            onOpenCallback?.()
          }
        }

        if (data.msg_type === "balance" && data.balance) {
          console.log("[v0] Balance received:", data.balance.balance)
          setAccountBalance(data.balance.balance)
        }

        if (data.msg_type === "copy_start" && !data.error) {
          setIsCopyingActive(true)
          showNotification("success", `Copy trading started (${copyMode})`)
        }

        if (data.msg_type === "copy_stop" && !data.error) {
          setIsCopyingActive(false)
          showNotification("success", "Copy trading stopped")
        }
      } catch (error) {
        console.error("[v0] Error parsing WebSocket message:", error)
      }
    }
  }

  const fetchBalance = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("[v0] Fetching balance...")
      wsRef.current.send(JSON.stringify({ balance: 1, req_id: Date.now() }))
    } else {
      console.warn("[v0] WebSocket not connected, cannot fetch balance")
    }
  }

  const fetchAccountDetails = async (token: string): Promise<{ name: string; realName: string; wallets: Wallet[] }> => {
    return new Promise<{ name: string; realName: string; wallets: Wallet[] }>((resolve, reject) => {
      const tempWs = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=108422")
      let authData: any = null
      let settingsData: any = null
      let isResolved = false

      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          tempWs.close()
          reject(new Error("Account details fetch timeout"))
        }
      }, 6000)

      tempWs.onopen = () => {
        console.log("[v0] Temp WebSocket opened for account details")
        tempWs.send(JSON.stringify({ authorize: token }))
      }

      tempWs.onmessage = (event) => {
        try {
          const data: ResponseData = JSON.parse(event.data)
          console.log("[v0] Temp WebSocket message:", data.msg_type)

          if (data.msg_type === "authorize") {
            if (data.error) {
              clearTimeout(timeout)
              isResolved = true
              reject(new Error(data.error.message))
              tempWs.close()
            } else {
              authData = data.authorize
              console.log("[v0] Authorization successful, requesting account settings...")
              tempWs.send(JSON.stringify({ get_account_settings: 1 }))
            }
          }

          if (data.msg_type === "get_account_settings") {
            clearTimeout(timeout)
            if (!isResolved) {
              isResolved = true
              settingsData = data.get_account_settings

              const loginid = authData?.loginid || "Account"

              let realName = loginid
              if (settingsData?.first_name && settingsData.first_name.trim()) {
                realName = settingsData.first_name
                if (settingsData?.last_name && settingsData.last_name.trim()) {
                  realName += ` ${settingsData.last_name}`
                }
              } else if (settingsData?.salutation && settingsData.salutation.trim()) {
                realName = settingsData.salutation
              } else if (settingsData?.name && settingsData.name.trim()) {
                realName = settingsData.name
              }

              console.log("[v0] Real name extracted:", realName)

              const mockWallets: Wallet[] = [
                { id: "demo_1", name: "Demo Wallet", balance: 10000, type: "demo" },
                { id: "real_1", name: "Real Wallet", balance: 5000, type: "real" },
              ]

              resolve({ name: loginid, realName: realName, wallets: mockWallets })
              tempWs.close()
            }
          }
        } catch (error) {
          console.error("[v0] Error parsing temp WebSocket message:", error)
        }
      }

      tempWs.onerror = (error) => {
        console.error("[v0] Temp WebSocket error:", error)
        clearTimeout(timeout)
        if (!isResolved) {
          isResolved = true
          reject(new Error("Failed to fetch account details"))
        }
      }

      tempWs.onclose = () => {
        console.log("[v0] Temp WebSocket closed")
        if (!isResolved) {
          isResolved = true
          clearTimeout(timeout)
          reject(new Error("Connection closed before account details received"))
        }
      }
    })
  }

  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const addFollower = async () => {
    if (!newFollowerToken.trim()) {
      showNotification("error", "Please enter a follower token")
      return
    }

    setIsLoading(true)
    try {
      const { name, realName, wallets } = await fetchAccountDetails(newFollowerToken.trim())

      localStorage.setItem(`realname_${name}`, realName)

      // Auto-select demo wallet if demo-to-demo mode
      const selectedWalletId = copyMode === "demo-to-demo" ? wallets.find((w) => w.type === "demo")?.id : wallets[0]?.id

      const newFollower: Follower = {
        loginid: name,
        token: newFollowerToken.trim(),
        name: newFollowerName || realName,
        realName: realName,
        status: "connected",
        balance: wallets.find((w) => w.id === selectedWalletId)?.balance,
        lastSync: new Date().toISOString(),
        selectedWallet: selectedWalletId,
        copyMode: copyMode,
        wallets: wallets,
      }

      setFollowers([...followers, newFollower])
      setNewFollowerToken("")
      setNewFollowerName("")
      showNotification("success", `Follower ${newFollower.realName} added successfully`)
    } catch (error) {
      showNotification("error", `Failed to add follower: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const removeFollower = (loginid: string) => {
    const follower = followers.find((f) => f.loginid === loginid)
    if (confirm(`Remove follower ${follower?.realName || loginid}?`)) {
      setFollowers(followers.filter((f) => f.loginid !== loginid))
      showNotification("success", "Follower removed")
    }
  }

  const updateFollowerWallet = (loginid: string, walletId: string) => {
    setFollowers(
      followers.map((f) => {
        if (f.loginid === loginid) {
          const selectedWallet = f.wallets?.find((w) => w.id === walletId)
          return {
            ...f,
            selectedWallet: walletId,
            balance: selectedWallet?.balance,
          }
        }
        return f
      }),
    )
  }

  const updateFollowerCopyMode = (loginid: string, mode: "demo-to-demo" | "demo-to-real") => {
    setFollowers(
      followers.map((f) => {
        if (f.loginid === loginid) {
          let newWalletId = f.selectedWallet
          if (mode === "demo-to-demo") {
            newWalletId = f.wallets?.find((w) => w.type === "demo")?.id || f.selectedWallet
          } else if (mode === "demo-to-real") {
            newWalletId = f.wallets?.find((w) => w.type === "real")?.id || f.selectedWallet
          }

          return {
            ...f,
            copyMode: mode,
            selectedWallet: newWalletId,
          }
        }
        return f
      }),
    )
  }

  const startCopyTrading = async () => {
    if (!activeAccount) {
      showNotification("error", "No active account selected")
      return
    }

    if (userRole === "follower" && !traderToken.trim()) {
      showNotification("error", "Please enter trader token")
      return
    }

    if (copyMode === "demo-to-real") {
      const confirmed = confirm(
        "⚠️ WARNING: You are about to enable Demo-to-Real copy mode. Trades in demo will affect REAL accounts. Continue?",
      )
      if (!confirmed) return
    }

    setIsLoading(true)
    try {
      if (userRole === "follower") {
        const { name, realName } = await fetchAccountDetails(traderToken.trim())
        setTraderName(name)
        setTraderRealName(realName)
        localStorage.setItem(`realname_${name}`, realName)
      }

      connectWebSocket(activeAccount.token, () => {
        const request = {
          copy_start: userRole === "trader" ? activeAccount.loginid : traderToken.trim(),
          copy_mode: copyMode,
          selected_wallet: selectedWallet,
          req_id: Date.now(),
        }
        wsRef.current?.send(JSON.stringify(request))
      })

      if (balanceCheckIntervalRef.current) clearInterval(balanceCheckIntervalRef.current)
      balanceCheckIntervalRef.current = setInterval(fetchBalance, 1000)
    } finally {
      setIsLoading(false)
    }
  }

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
                <li>✓ Demo-to-Demo & Demo-to-Real</li>
                <li>✓ Wallet selection per follower</li>
              </ul>
            </div>

            <div className={styles.roleOption} onClick={() => setUserRole("follower")}>
              <div className={styles.roleIcon}>📊</div>
              <h2>Follower Mode</h2>
              <p>Copy trades from expert traders</p>
              <ul className={styles.roleFeatures}>
                <li>✓ Automatic trade mirroring</li>
                <li>✓ Multi-wallet support</li>
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
              {accountRealName && <p className={styles.accountNameDisplay}>Account: {accountRealName}</p>}
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
                      <span className={styles.label}>Account Name:</span>
                      <span className={styles.value}>{accountRealName || accountName || activeAccount.loginid}</span>
                    </div>
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
                    {isCopyingActive && (
                      <div className={styles.accountRow}>
                        <span className={styles.label}>Copy Mode:</span>
                        <span className={styles.value}>{copyMode}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.noData}>No account available. Please authorize first.</p>
                )}
              </div>

              {userRole === "follower" && userWallets.length > 0 && (
                <div className={styles.section}>
                  <h2>Select Wallet</h2>
                  <div className={styles.walletGrid}>
                    {userWallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        className={`${styles.walletCard} ${selectedWallet === wallet.id ? styles.selected : ""}`}
                        onClick={() => setSelectedWallet(wallet.id)}
                      >
                        <div className={styles.walletType}>{wallet.type === "demo" ? "📋" : "💰"}</div>
                        <h3>{wallet.name}</h3>
                        <p className={styles.walletBalance}>{wallet.balance.toFixed(2)}</p>
                        <p className={styles.walletType}>{wallet.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy Trading Controls */}
              <div className={styles.section}>
                <h2>Copy Trading Controls</h2>

                <div className={styles.formGroup}>
                  <label>Copy Mode</label>
                  <div className={styles.modeSelector}>
                    <button
                      className={`${styles.modeButton} ${copyMode === "demo-to-demo" ? styles.active : ""}`}
                      onClick={() => setCopyMode("demo-to-demo")}
                    >
                      📋 Demo-to-Demo
                    </button>
                    <button
                      className={`${styles.modeButton} ${copyMode === "demo-to-real" ? styles.active : ""}`}
                      onClick={() => setCopyMode("demo-to-real")}
                    >
                      💰 Demo-to-Real
                    </button>
                  </div>
                  <p className={styles.helperText}>
                    {copyMode === "demo-to-demo"
                      ? "Trades in demo will be copied to follower's demo"
                      : "Trades in demo will be copied to follower's real account"}
                  </p>
                </div>

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
                    {traderRealName && <p className={styles.helperText}>Trader: {traderRealName}</p>}
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
                </div>
                <div className={styles.formGroup}>
                  <label>Follower Name (Optional)</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Enter a name for this follower"
                    value={newFollowerName}
                    onChange={(e) => setNewFollowerName(e.target.value)}
                  />
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
                            <h3>{follower.realName || follower.name || follower.loginid}</h3>
                            <p className={styles.followerStatus}>
                              <span className={`${styles.statusIndicator} ${styles[follower.status]}`}></span>
                              {follower.status.charAt(0).toUpperCase() + follower.status.slice(1)}
                            </p>
                          </div>
                          <button onClick={() => removeFollower(follower.loginid)} className={styles.deleteButton}>
                            ✕
                          </button>
                        </div>

                        {follower.wallets && follower.wallets.length > 0 && (
                          <div className={styles.followerWallets}>
                            <label>Select Wallet:</label>
                            <div className={styles.walletOptions}>
                              {follower.wallets.map((wallet) => (
                                <button
                                  key={wallet.id}
                                  className={`${styles.walletOption} ${
                                    follower.selectedWallet === wallet.id ? styles.selected : ""
                                  }`}
                                  onClick={() => updateFollowerWallet(follower.loginid, wallet.id)}
                                >
                                  {wallet.type === "demo" ? "📋" : "💰"} {wallet.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={styles.followerMode}>
                          <label>Copy Mode:</label>
                          <div className={styles.modeOptions}>
                            <button
                              className={`${styles.modeOption} ${
                                follower.copyMode === "demo-to-demo" ? styles.selected : ""
                              }`}
                              onClick={() => updateFollowerCopyMode(follower.loginid, "demo-to-demo")}
                            >
                              📋 Demo-to-Demo
                            </button>
                            <button
                              className={`${styles.modeOption} ${
                                follower.copyMode === "demo-to-real" ? styles.selected : ""
                              }`}
                              onClick={() => updateFollowerCopyMode(follower.loginid, "demo-to-real")}
                            >
                              💰 Demo-to-Real
                            </button>
                          </div>
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
