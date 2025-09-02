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

// Small, visible OSTH logo
const OsthLogo = () => (
    <div className="osth-logo">
        
 <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
  <g>
    <circle cx="16" cy="16" r="14" fill="#25D366"/>
    <path d="M16 7.5c-4.7 0-8.5 3.8-8.5 8.5 0 1.5.39 2.97 1.14 4.26l-1.22 4.46 4.57-1.2c1.23.68 2.63 1.05 4.01 1.05 4.7 0 8.5-3.8 8.5-8.5S20.7 7.5 16 7.5zm0 15.45c-1.21 0-2.41-.32-3.44-.93l-.25-.15-2.71.71.73-2.64-.16-.27a6.97 6.97 0 01-1.07-3.72c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7zm3.87-5.31c-.2-.1-1.2-.6-1.39-.67-.19-.07-.32-.1-.45.1-.13.19-.52.66-.64.79-.12.13-.24.15-.44.05-.2-.1-.83-.3-1.58-.97a5.97 5.97 0 01-1.1-1.37c-.12-.21-.01-.32.09-.42.1-.1.22-.25.32-.38.1-.13.13-.22.19-.36.06-.13.03-.27-.01-.38-.05-.13-.45-1.08-.62-1.48-.16-.39-.33-.34-.45-.34h-.38c-.12 0-.31.04-.47.2s-.61.59-.61 1.43c0 .84.62 1.65.71 1.76.09.11 1.22 1.85 2.97 2.53.42.14.74.22.99.28.42.09.81.08 1.11.05.34-.03 1.04-.42 1.18-.83.15-.41.15-.76.1-.83-.06-.07-.18-.11-.38-.2z" fill="#fff"/>
  </g>
</svg>
    </div>
);

// Notification Bell Icon - Orangey theme
const NotificationIcon = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const { isDesktop } = useDevice();

    return (
        <>
            <button 
                className="notification-icon"
                onClick={() => setShowNotifications(true)}
                aria-label="View notifications"
            >
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    <g>
                        <ellipse cx="16" cy="27" rx="6" ry="3" fill="#fb923c" opacity="0.25"/>
                        <path
                            d="M23 22V14c0-4.418-3.582-8-8-8s-8 3.582-8 8v8l-1.667 1.667A1 1 0 0 0 6 25h20a1 1 0 0 0 .667-1.667L23 22Z"
                            fill="#fb923c"
                            stroke="#ea580c"
                            strokeWidth="1.2"
                        />
                        <path
                            d="M16 29c2.7 0 4-1.3 4-2H12c0 .7 1.3 2 4 2Z"
                            fill="#ea580c"
                        />
                    </g>
                </svg>
                <span className="notification-badge">2</span>
            </button>
            {showNotifications && (
                <div className="notification-popup-overlay" onClick={() => setShowNotifications(false)}>
                    <div 
                        className={clsx("notification-popup", {
                            "notification-popup--mobile": !isDesktop,
                            "notification-popup--desktop": isDesktop
                        })}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="notification-popup__header">
                            <h3 className="notification-popup__title">Announcements</h3>
                            <button 
                                className="notification-popup__close"
                                onClick={() => setShowNotifications(false)}
                                aria-label="Close notifications"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path 
                                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="notification-popup__content">
                            <iframe
                                src="https://mesoflixannouncements.netlify.app/"
                                className="notification-iframe"
                                title="Notifications"
                                frameBorder="0"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const AppHeader = observer(() => {
    const { isDesktop } = useDevice();
    const { isAuthorizing, activeLoginid } = useApiBase();
    const { client } = useStore() ?? {};

    const { data: activeAccount } = useActiveAccount({ allBalanceData: client?.all_accounts_balance });
    const { accounts } = client ?? {};
    const has_wallet = Object.keys(accounts ?? {}).some(id => accounts?.[id].account_category === 'wallet');
    const { localize } = useTranslations();

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
                                className='manage-funds-button blue-theme'
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
                                className='deposit-button blue-theme'
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
                        className="blue-theme"
                        onClick={() => {
                            window.location.replace('https://oauth.deriv.com/oauth2/authorize?app_id=82991&l=EN&brand=Osamtradinghub');
                        }}
                    >
                        <Localize i18n_default_text='Log in' />
                    </Button>
                    <Button
                        primary
                        className="blue-theme"
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

    return (
        <Header
            className={clsx('app-header', {
                'app-header--desktop': isDesktop,
                'app-header--mobile': !isDesktop,
            })}
        >
            <Wrapper variant='left'>
                <AppLogo />
                <MobileMenu />
                <div className="header-icons-container">
                    <OsthLogo />
                    <NotificationIcon />
                </div>
            </Wrapper>
            <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
        </Header>
    );
});

export default AppHeader;
