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
import MenuItems from './menu-items';
import MobileMenu from './mobile-menu';
import PlatformSwitcher from './platform-switcher';
import './header.scss';
import React, { useState } from 'react';

// OSAM Trading Hub Blue Logo
const OsamTradingHubLogo = () => {
    const [isAnimating, setIsAnimating] = useState(false);
    const handleLogoClick = () => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 800);
    };

    return (
        <div 
            className={`osam-tradinghub-logo ${isAnimating ? 'osam-tradinghub-logo--animating' : ''}`}
            onClick={handleLogoClick}
            title="OSAM Trading Hub"
        >
            <svg width="42" height="42" viewBox="0 0 52 52" fill="none">
                <defs>
                    <linearGradient id="osamMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#5eb8ff" />
                        <stop offset="25%" stopColor="#1769aa" />
                        <stop offset="80%" stopColor="#1e90ff" />
                        <stop offset="100%" stopColor="#114a7d" />
                    </linearGradient>
                    <linearGradient id="osamAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="60%" stopColor="#e6f5ff" />
                        <stop offset="100%" stopColor="#b3dbff" />
                    </linearGradient>
                    <filter id="osamDropShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                        <feOffset dx="2" dy="5" result="offset"/>
                        <feFlood floodColor="#1769aa" floodOpacity="0.18"/>
                        <feComposite in2="offset" operator="in"/>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <filter id="osamGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                {/* Outer blue shadow */}
                <circle cx="26" cy="26" r="23.5" fill="#5eb8ff" opacity="0.16" filter="blur(2.5px)" />
                {/* Main blue circle */}
                <circle cx="26" cy="26" r="22" fill="url(#osamMainGradient)" filter="url(#osamDropShadow)" />
                {/* Inner white accent ring */}
                <circle cx="26" cy="26" r="20" fill="none" stroke="url(#osamAccentGradient)" strokeWidth="2" opacity="0.6" />
                {/* Stylized O */}
                <g filter="url(#osamGlow)">
                    <ellipse cx="18" cy="26" rx="7" ry="12" fill="url(#osamAccentGradient)" opacity="0.98" />
                    <ellipse cx="18" cy="26" rx="3.6" ry="7.2" fill="url(#osamMainGradient)" opacity="0.98" />
                </g>
                {/* Stylized S */}
                <g filter="url(#osamGlow)">
                    <path d="M25 17c2-4 10-2 9 3.5-1 6-8 3.5-8 7.5s7 5 9 1" stroke="url(#osamMainGradient)" strokeWidth="2.2" fill="none" opacity="0.95"/>
                </g>
                {/* Stylized A (triangle) */}
                <polygon points="32,36 37,16 42,36" fill="url(#osamAccentGradient)" stroke="#1769aa" strokeWidth="1.1" filter="url(#osamGlow)" />
                {/* Stylized M (two lines) */}
                <g filter="url(#osamGlow)">
                    <polyline points="44,36 46,22 48,36" fill="none" stroke="#1769aa" strokeWidth="2"/>
                    <polyline points="46,22 47,28 48,22" fill="none" stroke="#1e90ff" strokeWidth="1.2"/>
                </g>
                {/* Accent dots and shine */}
                <circle cx="12" cy="16" r="2.2" fill="#1e90ff" opacity="0.85"/>
                <circle cx="40" cy="12" r="1.5" fill="#5eb8ff" opacity="0.7"/>
                <ellipse cx="26" cy="17" rx="10" ry="2.6" fill="#fff" opacity="0.15" />
            </svg>
            <span className="osam-tradinghub-logo__text">OSAM Trading Hub</span>
        </div>
    );
};

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

    // Notification popup state
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
                    {/* OSAM Trading Hub Logo */}
                    <OsamTradingHubLogo />
                    {/* AppLogo only on mobile/tablet */}
                    {!isDesktop && <AppLogo />}
                    {/* Menu open functionality */}
                    <MobileMenu />
                    {/* Notification Bell */}
                    {renderNotificationBell()}
                </div>
            </Wrapper>
            <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
        </Header>
    );
});

export default AppHeader;
