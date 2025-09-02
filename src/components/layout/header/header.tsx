import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { standalone_routes } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { StandaloneCircleUserRegularIcon } from '@deriv/quill-icons/Standalone';
import { requestOidcAuthentication } from '@deriv-com/auth-client';
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

// OSTH Logo Component
const OSTHLogo = () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
        // Add animation on click
        setIsAnimating(true);
        
        // Navigate to OSAM Trading Hub or perform other action
        window.open('https://osamtradinghub.com', '_blank');
        
        // Reset animation after 2 seconds
        setTimeout(() => setIsAnimating(false), 2000);
    };

    return (
        <div className="osth-logo-container">
            <button 
                className={clsx("osth-logo", {
                    "osth-logo--animated": isAnimating
                })}
                onClick={handleClick}
                aria-label="Visit OSAM Trading Hub"
            >
                <span className="osth-text">OSTH</span>
            </button>
        </div>
    );
};

// New Notification Icon Component
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                        d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" 
                        fill="#FF6B35"
                    />
                </svg>
                <span className="notification-badge">2</span>
            </button>

            {/* Notification Popup */}
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
                                        d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" 
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

    const { isOAuth2Enabled } = useOauth2();

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
                        onClick={() => {
                            window.location.replace('https://oauth.deriv.com/oauth2/authorize?app_id=84866&l=EN&brand=AUTOTOOL');
                        }}
                    >
                        <Localize i18n_default_text='Log in' />
                    </Button>
                    <Button
                        primary
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
                    <OSTHLogo />
                    <NotificationIcon />
                </div>
            </Wrapper>
            <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
        </Header>
    );
});

export default AppHeader;
