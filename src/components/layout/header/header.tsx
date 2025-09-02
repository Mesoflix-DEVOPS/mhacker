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

// Notification Bell SVG Component
const NotificationBellIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 2C8.686 2 6 4.686 6 8V10.58C6 12.17 5.36 13.69 4.24 14.82L3.29 15.77C2.92 16.14 3.18 16.75 3.7 16.75H20.3C20.82 16.75 21.08 16.14 20.71 15.77L19.76 14.82C18.64 13.69 18 12.17 18 10.58V8C18 4.686 15.314 2 12 2ZM12 22C13.104 22 14 21.104 14 20H10C10 21.104 10.896 22 12 22Z"
            fill="currentColor"
        />
    </svg>
);

// PromoClub Logo Component (unchanged)
const PromoClubLogo = () => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLogoClick = () => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 800);
    };

    return (
        <div 
            className={`promoclub-logo ${isAnimating ? 'promoclub-logo--animating' : ''}`}
            onClick={handleLogoClick}
        >

        </div>
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
                <AppLogo />
                <MobileMenu />
                <PromoClubLogo />
                {renderNotificationBell()}
            </Wrapper>
            <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
        </Header>
    );
});

export default AppHeader;
