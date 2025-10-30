import { initSurvicate } from '../public-path';
import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { StoreProvider } from '@/hooks/useStore';
import CallbackPage from '@/pages/callback';
import Endpoint from '@/pages/endpoint';
import { TAuthData } from '@/types/api-types';
import { initializeI18n, localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));

const { TRANSLATIONS_CDN_URL, R2_PROJECT_NAME, CROWDIN_BRANCH_NAME } = process.env;
const i18nInstance = initializeI18n({
    cdnUrl: `${TRANSLATIONS_CDN_URL}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`,
});

// --- NEW ANIMATION COMPONENT ---
const TraderLoading = () => {
    // Simulated prices for a ticker
    const prices = [1.2345, 1.2352, 1.2360, 1.2348, 1.2371, 1.2359, 1.2383, 1.2365, 1.2379, 1.2357];
    const [priceIndex, setPriceIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setPriceIndex((prev) => (prev + 1) % prices.length);
        }, 350);
        return () => clearInterval(interval);
    }, [prices.length]);

    return (
        <div className="trader-loader-root">
            <div className="graph-area">
                <div className="graph-lines">
                    {/* Animated graph bars */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className={`graph-bar graph-bar-${i}`}></div>
                    ))}
                    {/* Animated polyline */}
                    <svg className="graph-polyline" width="320" height="80" viewBox="0 0 320 80">
                        <polyline
                            points="0,60 20,50 40,65 60,45 80,60 100,35 120,55 140,30 160,60 180,50 200,65 220,45 240,60 260,35 280,55 300,30 320,60"
                            stroke="#38ef7d"
                            strokeWidth="3"
                            fill="none"
                            style={{ filter: 'drop-shadow(0 0 8px #38ef7d)' }}
                        />
                    </svg>
                </div>
                <div className="graph-footer">
                    <span className="ticker-label">EUR/USD</span>
                    <span className="ticker-price">{prices[priceIndex].toFixed(4)}</span>
                    <span className="ticker-right">Live Market</span>
                </div>
            </div>
            <div className="trader-loader-text">
                Connecting to trading server...
            </div>
        </div>
    );
};

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <Suspense fallback={<TraderLoading />}>
                    <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                        <StoreProvider>
                            <RoutePromptDialog />
                            <CoreStoreProvider>
                                <Layout />
                            </CoreStoreProvider>
                        </StoreProvider>
                    </TranslationProvider>
                </Suspense>
            }
        >
            <Route index element={<AppRoot />} />
            <Route path='endpoint' element={<Endpoint />} />
            <Route path='callback' element={<CallbackPage />} />
        </Route>
    )
);

function App() {
    useEffect(() => {
        initSurvicate();
        window?.dataLayer?.push({ event: 'page_load' });

        return () => {
            const survicateBox = document.getElementById('survicate-box');
            if (survicateBox) {
                survicateBox.style.display = 'none';
            }
        };
    }, []);

    useEffect(() => {
        const accountsList = localStorage.getItem('accountsList');
        const clientAccounts = localStorage.getItem('clientAccounts');
        const activeLoginid = localStorage.getItem('active_loginid');
        const urlParams = new URLSearchParams(window.location.search);
        const accountCurrency = urlParams.get('account');

        if (!accountsList || !clientAccounts) return;

        try {
            const parsedAccounts = JSON.parse(accountsList);
            const parsedClientAccounts = JSON.parse(clientAccounts) as TAuthData['account_list'];
            const isValidCurrency = accountCurrency
                ? Object.values(parsedClientAccounts).some(
                      (account) => account.currency.toUpperCase() === accountCurrency.toUpperCase()
                  )
                : false;

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            // Handle demo account
            if (accountCurrency?.toUpperCase() === 'DEMO') {
                const demoAccount = Object.entries(parsedAccounts).find(([key]) => key.startsWith('VR'));

                if (demoAccount) {
                    const [loginid, token] = demoAccount;
                    updateLocalStorage(String(token), loginid);
                    return;
                }
            }

            // Handle real account with valid currency
            if (accountCurrency?.toUpperCase() !== 'DEMO' && isValidCurrency) {
                const realAccount = Object.entries(parsedClientAccounts).find(
                    ([loginid, account]) =>
                        !loginid.startsWith('VR') && account.currency.toUpperCase() === accountCurrency?.toUpperCase()
                );

                if (realAccount) {
                    const [loginid, account] = realAccount;
                    if ('token' in account) {
                        updateLocalStorage(String(account?.token), loginid);
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Error parsing accounts:', e);
        }
    }, []);

    // ✅ Register the service worker (for PWA support)
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .then((registration) => {
                        console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch((error) => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }
    }, []);

    return <RouterProvider router={router} />;
}

export default App;
