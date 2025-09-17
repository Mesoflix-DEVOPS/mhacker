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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="26" viewBox="0 0 160 160">
            <defs>
                <linearGradient id="fxg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#00d084"/>
                    <stop offset="50%" stop-color="#1e90ff"/>
                    <stop offset="100%" stop-color="#1769aa"/>
                </linearGradient>
            </defs>
            <circle cx="80" cy="80" r="70" fill="url(#fxg)"/>
            <circle cx="80" cy="80" r="70" fill="none" stroke="white" stroke-width="4" stroke-opacity="0.9"/>
            <line x1="55" y1="50" x2="55" y2="105" stroke="#00d084" stroke-width="3"/>
            <rect x="49" y="70" width="12" height="25" rx="2" fill="#00d084"/>
            <line x1="80" y1="45" x2="80" y2="100" stroke="#ff4d4f" stroke-width="3"/>
            <rect x="74" y="65" width="12" height="25" rx="2" fill="#ff4d4f"/>
            <line x1="105" y1="55" x2="105" y2="110" stroke="#00d084" stroke-width="3"/>
            <rect x="99" y="75" width="12" height="25" rx="2" fill="#00d084"/>
            <text x="80" y="135" text-anchor="middle" font-family="Poppins, Segoe UI, sans-serif" font-weight="700" font-size="2" fill="white" opacity="0.95">OSAM</text>
        </svg>
        <span className="osam-logo__text">OSAM</span>
    </div>
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
                            window.open('https://track.deriv.com/_qeVMn9Bcq2YKqFKZ7JdnQ2Nd7ZgqdRLk/1/', '_blank');
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
            <Wrapper variant="left">
                <div className="left-section">
                    {!isDesktop && (
                        <>
                            <MobileMenu />
                            <OsamLogo />
                            <AppLogo />
                        </>
                    )}
                    {isDesktop && (
                        <>
                            <OsamLogo />
                        </>
                    )}
                </div>
            </Wrapper>
            <Wrapper variant="right">
                {renderAccountSection()}
            </Wrapper>
        </Header>
    );
});

export default AppHeader;
