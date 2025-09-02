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
import Modal from '@/components/shared_ui/modal'; // Import the modal component

// Updated InfoIcon with a messages SVG icon
const InfoIcon = () => {
    const [showModal, setShowModal] = useState(false);

    const socialLinks = [
        {
            name: 'Telegram',
            url: 'https://t.me/lemic23',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0C5.37 0 0 5.37 0 12C0 18.63 5.37 24 12 24C18.63 24 24 18.63 24 12C24 5.37 18.63 0 12 0ZM17.94 8.19L15.98 17.03C15.82 17.67 15.42 17.83 14.88 17.52L11.88 15.33L10.34 16.81C10.16 16.99 9.98 17.17 9.69 17.17L9.92 14.09L15.58 9.03C15.83 8.81 15.53 8.69 15.19 8.91L8.07 13.54L5.08 12.61C4.45 12.41 4.44 11.96 5.23 11.67L17.02 7.19C17.61 6.98 18.14 7.35 17.94 8.19Z" fill="#229ED9"/>
                </svg>
            )
        },
        {
            name: 'Email',
            url: 'mesoflixltd@gmail.com',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM19.6 8.25L12.53 12.67C12.21 12.87 11.79 12.87 11.47 12.67L4.4 8.25C4.15 8.09 4.06 7.76 4.22 7.51C4.38 7.26 4.71 7.17 4.96 7.33L12 11.58L19.04 7.33C19.29 7.17 19.62 7.26 19.78 7.51C19.94 7.76 19.85 8.09 19.6 8.25Z" fill="#EA4335"/>
                </svg>
            )
        },
        {
            name: 'Website',
            url: 'https://mesoflix.online',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#333399"/>
                </svg>
            )
        },
        {
            name: 'TikTok',
            url: 'https://tiktok.com/autotool',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M16.6 5.82C15.9165 5.03962 15.5397 4.03743 15.54 3H12.45V15.4C12.4261 16.071 12.1428 16.7066 11.6597 17.1729C11.1766 17.6393 10.5316 17.8999 9.86 17.91C8.44 17.91 7.26 16.74 7.26 15.33C7.26 13.92 8.44 12.75 9.86 12.75C10.13 12.75 10.39 12.78 10.64 12.83V10.22C10.37 10.18 10.1 10.16 9.83 10.16C6.96 10.16 4.61 12.52 4.61 15.39C4.61 18.26 6.96 20.62 9.83 20.62C12.7 20.62 15.05 18.26 15.05 15.39V8.19C16.05 8.71 17.19 9 18.41 9V5.82H16.6Z" fill="#000"/>
                </svg>
            )
        },
        {
            name: 'WhatsApp',
            url: 'https://wa.link/11herx',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.49 15.55 3.36 17.02L2.05 21.95L7.08 20.66C8.51 21.48 10.19 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.53 15.5C16.37 15.78 15.86 16.01 15.39 16.1C15.18 16.14 14.85 16.22 14.24 16.07C13.33 15.85 11.94 15.17 10.77 14.01C9.6 12.85 8.93 11.46 8.71 10.55C8.56 9.94 8.64 9.61 8.68 9.4C8.77 8.93 9 8.42 9.28 8.27C9.44 8.19 9.65 8.13 9.8 8.16C10.01 8.2 10.23 8.45 10.37 8.67C10.47 8.83 10.57 9.07 10.66 9.25C10.77 9.47 10.71 9.62 10.58 9.8C10.53 9.87 10.47 9.98 10.52 10.06C11.12 11.01 11.98 11.87 12.93 12.47C13.01 12.52 13.12 12.46 13.19 12.41C13.37 12.28 13.52 12.22 13.74 12.33C13.92 12.43 14.16 12.53 14.32 12.63C14.54 12.77 14.79 12.99 14.83 13.2C14.86 13.36 14.8 13.57 14.72 13.73Z" fill="#25D366"/>
                </svg>
            )
        }
    ];

    return (
        <>
            <button 
                className="info-icon"
                onClick={() => setShowModal(true)}
            >
                {/* Messages Icon SVG */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4A90E2" d="M12 2C6.48 2 2 6.48 2 12c0 4.36 2.79 8.06 6.65 9.39.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.71.59-3.28-1.28-3.28-1.28-.45-1.13-1.11-1.43-1.11-1.43-.91-.61.07-.6.07-.6 1 .07 1.52 1.01 1.52 1.01.9 1.51 2.36 1.07 2.94.82.09-.65.35-1.07.63-1.31-2.17-.25-4.46-1.07-4.46-4.77 0-1.05.38-1.91 1-2.59-.1-.26-.44-1.3.1-2.7 0 0 .83-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8a9.56 9.56 0 0 1 2.5.34c1.92-1.29 2.75-1.02 2.75-1.02.54 1.4.2 2.44.1 2.7.62.68 1 1.54 1 2.59 0 3.71-2.3 4.52-4.48 4.76.36.31.68.91.68 1.84 0 1.33-.01 2.4-.01 2.73 0 .27.18.59.69.49A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z"/>
                </svg>
            </button>

            <Modal
                is_open={showModal}
                toggleModal={() => setShowModal(false)}
                title="Connect With Us"
            >
                <div className="social-links-modal">
                    {socialLinks.map((link, index) => (
                        <a 
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-link"
                        >
                            <span className="social-link__icon">{link.icon}</span>
                            <span className="social-link__name">{link.name}</span>
                        </a>
                    ))}
                </div>
            </Modal>
        </>
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
                    <InfoIcon />
                    <NotificationIcon />
                </div>
            </Wrapper>
            <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
        </Header>
    );
});

export default AppHeader;
