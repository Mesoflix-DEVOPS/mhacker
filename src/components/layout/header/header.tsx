import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { standalone_routes } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { StandaloneCircleUserRegularIcon } from '@deriv/quill-icons/Standalone';
import { Localize, useTranslations } from '@deriv-com/translations';
import { Header, useDevice, Wrapper } from '@deriv-com/ui';
import { Tooltip } from '@deriv-com/ui';
import { AppLogo } from '../app-logo';
import AccountsInfoLoader from './account-info-loader';
import AccountSwitcher from './account-switcher';
import MobileMenu from './mobile-menu';
import './header.scss';
import React, { useState } from 'react';

// Beautiful OSAM Trading Hub Logo (Blue theme, stylized like DH)
const OsamLogo = () => (
    <div className="osam-logo" title="OSAM Trading Hub">
      <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-labelledby="title desc">
  <title>OSAM Forex Logo</title>
  <desc>Trading logo with candlesticks and OSAM text inside a circular badge.</desc>
  <defs>
    <!-- Main gradient -->
    <linearGradient id="fxg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00d084"/>
      <stop offset="50%" stop-color="#1e90ff"/>
      <stop offset="100%" stop-color="#1769aa"/>
    </linearGradient>
    <!-- Glow -->
    <filter id="fxShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="5" result="off"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.25"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Circular badge -->
  <circle cx="80" cy="80" r="70" fill="url(#fxg)" filter="url(#fxShadow)"/>
  <circle cx="80" cy="80" r="70" fill="none" stroke="white" stroke-width="4" stroke-opacity="0.9"/>

  <!-- Candlesticks -->
  <!-- Bullish -->
  <line x1="55" y1="50" x2="55" y2="105" stroke="#00d084" stroke-width="3"/>
  <rect x="49" y="70" width="12" height="25" rx="2" fill="#00d084"/>

  <!-- Bearish -->
  <line x1="80" y1="45" x2="80" y2="100" stroke="#ff4d4f" stroke-width="3"/>
  <rect x="74" y="65" width="12" height="25" rx="2" fill="#ff4d4f"/>

  <!-- Bullish -->
  <line x1="105" y1="55" x2="105" y2="110" stroke="#00d084" stroke-width="3"/>
  <rect x="99" y="75" width="12" height="25" rx="2" fill="#00d084"/>

  <!-- Name inside -->
  <text x="80" y="135" text-anchor="middle"
        font-family="Poppins, Segoe UI, sans-serif"
        font-weight="700"
        font-size="22"
        fill="white"
        opacity="0.95">OSAM</text>

  <!-- Shine accent -->
  <ellipse cx="80" cy="48" rx="42" ry="8" fill="#FFFFFF" opacity="0.15"/>
</svg>

        <span className="osam-logo__text">OSAM</span>
    </div>
);

// Notification Bell SVG Component
const NotificationBellIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 2C8.686 2 6 4.686 6 8V10.58C6 12.17 5.36 13.69 4.24 14.82L3.29 15.77C2.92 16.14 3.18 16.75 3.7 16.75H20.3C20.82 16.75 21.08 16.14 20.71 15.77L19.76 14.82C18.64 13.69 18 12.17 18 10.58V8C18 4.686 15.314 2 12 2ZM12 22C13.104 22 14 21.104 14 20H10C10 21.104 10.896 22 12 22Z"
            fill="currentColor"
        />
    </svg>
);

const AppHeader = observer(() => {
    const { isDesktop } = useDevice();
    const { isAuthorizing, activeLoginid } = useApiBase();
    const { client } = useStore() ?? {};
    const { data: activeAccount } = useActiveAccount({ allBalanceData: client?.all_accounts_balance });
    const { accounts } = client ?? {};
    const has_wallet = Object.keys(accounts ?? {}).some(id => accounts?.[id].account_category === 'wallet');
    const { localize } = useTranslations();
    const { isOAuth2Enabled } = useOauth2();
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);

    const renderAccountSection = () => {
        if (isAuthorizing) {
            return <AccountsInfoLoader isLoggedIn isMobile={!isDesktop} speed={3} />;
        } else if (activeLoginid) {
            return (
                <>
                    {isDesktop && (
                        <Tooltip
                            as='a'
                            href={standalone_routes.personal_details}
                            tooltipContent={localize('Manage account settings')}
                            tooltipPosition='bottom'
                            className='app-header__account-settings'
                        >
                            <StandaloneCircleUserRegularIcon className='app-header__profile_icon' />
                        </Tooltip>
                    )}
                    <AccountSwitcher activeAccount={activeAccount} />
                    {isDesktop &&
                        (has_wallet ? (
                            <Button
                                className='manage-funds-button'
                                has_effect
                                text={localize('Manage funds')}
                                onClick={() => window.location.assign(standalone_routes.wallets_transfer)}
                                primary
                            />
                        ) : (
                            <Button
                                primary
                                onClick={() => {
                                    window.location.assign(standalone_routes.cashier_deposit);
                                }}
                                className='deposit-button'
                            >
                                {localize('Deposit')}
                            </Button>
                        ))}
                </>
            );
        } else {
            return (
                <div className='auth-actions'>
                    <Button
                        tertiary
                        className='login-button'
                        onClick={() => {
                            window.location.replace('https://oauth.deriv.com/oauth2/authorize?app_id=82991&l=EN&brand=OSAMTRADINGHUB');
                        }}
                    >
                        <Localize i18n_default_text='Log in' />
                    </Button>
                    <Button
                        primary
                        className='signup-button'
                        onClick={() => {
                            window.open(standalone_routes.signup);
                        }}
                    >
                        <Localize i18n_default_text='Sign up' />
                    </Button>
                </div>
            );
        }
    };

    // Notification Bell with badge and popup trigger
    const renderNotificationBell = () => (
        <div className="notifications__wrapper">
            <button
                className="notifications__bell"
                aria-label="Notifications"
                onClick={() => setShowNotificationPopup(true)}
            >
                <NotificationBellIcon />
                <span className="notifications__badge">2</span>
            </button>
            {showNotificationPopup && (
                <div className="notifications__popup-overlay" onClick={() => setShowNotificationPopup(false)}>
                    <div
                        className="notifications__popup"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="notifications__close"
                            aria-label="Close notifications"
                            onClick={() => setShowNotificationPopup(false)}
                        >
                            &times;
                        </button>
                        <iframe
                            src="https://mesoflixannouncements.netlify.app/"
                            title="Announcements"
                            className="notifications__iframe"
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <Header
            className={clsx('app-header', {
                'app-header--desktop': isDesktop,
                'app-header--mobile': !isDesktop,
            })}
        >
            <Wrapper variant='left'>
                <div className="left-section">
                    {/* On mobile/tablet: menu, logo, app logo */}
                    {!isDesktop && (
                        <>
                            <MobileMenu />
                            <OsamLogo />
                            <AppLogo />
                        </>
                    )}
                    {/* On desktop: logo, notification bell */}
                    {isDesktop && (
                        <>
                            <OsamLogo />
                        </>
                    )}
                    {renderNotificationBell()}
                </div>
            </Wrapper>
            <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
        </Header>
    );
});

export default AppHeader;
