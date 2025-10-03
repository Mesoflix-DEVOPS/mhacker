import React from 'react';
import { Dialog, Icon, Text } from '@deriv/components';
import { localize } from '@deriv/translations';

interface BotSettingsSType {
    take_profit: React.MutableRefObject<number>;
    stop_loss: React.MutableRefObject<number>;
    enable_tp_sl: React.MutableRefObject<boolean>;
    showBotSettings: boolean;
    takeProfitValue: string | number;
    stopLossValue: string | number;
    liveAccCR: string;
    enableSlTpValue: boolean;
    enableCopyDemo: boolean;
    enable_demo_copy: React.MutableRefObject<boolean>;

    setTakeProfitValue: React.Dispatch<React.SetStateAction<string | number>>;
    setStopLossValue: React.Dispatch<React.SetStateAction<string | number>>;
    setShowBotSettings: React.Dispatch<React.SetStateAction<boolean>>;
    setEnableSlTpValue: React.Dispatch<React.SetStateAction<boolean>>;
    setCopyDemo: React.Dispatch<React.SetStateAction<boolean>>;
    setLiveAccCr: React.Dispatch<React.SetStateAction<string>>;
}

const BotSettings = ({
    enable_tp_sl,
    showBotSettings,
    stop_loss,
    take_profit,
    takeProfitValue,
    stopLossValue,
    enableSlTpValue,
    enableCopyDemo,
    enable_demo_copy,
    liveAccCR,
    setShowBotSettings,
    setTakeProfitValue,
    setStopLossValue,
    setEnableSlTpValue,
    setCopyDemo,
    setLiveAccCr,
}: BotSettingsSType) => {
    const onClickClose = () => {
        setShowBotSettings(!showBotSettings);
    };

    const handleTpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setTakeProfitValue(newValue === '' ? '' : Number(newValue));
        take_profit.current = newValue !== '' ? Number(newValue) : 0;
    };

    const handleSlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setStopLossValue(newValue === '' ? '' : Number(newValue));
        stop_loss.current = newValue !== '' ? Number(newValue) : 0;
    };

    const handleLiveAccCrChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setLiveAccCr(newValue);
    };

    const handleIsActiveInActive = () => {
        setEnableSlTpValue(!enableSlTpValue);
        enable_tp_sl.current = !enable_tp_sl.current;
    };

    const handleDemoCopy = () => {
        setCopyDemo(!enableCopyDemo);
        enable_demo_copy.current = !enable_demo_copy.current;
    };
    return (
        <Dialog
            is_visible={true}
            is_mobile_full_width
            className={'dc-dialog bot-stopped-dialog'}
            confirm_button_text={localize('Close')}
            onConfirm={() => onClickClose()}
        >
            <div className='dc-dialog__content__header'>
                <Text data-testid='data-title' weight='bold' as='p' align='left' size='s' color='prominent'>
                    {localize('Market Analysis Settings')}
                </Text>
                <div
                    data-testid='data-close-button'
                    onClick={onClickClose}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            onClickClose();
                        }
                    }}
                    tabIndex={0}
                >
                    <Icon icon='IcCross' />
                </div>
            </div>
            <div className='bot_options'>
                <div className='tp'>
                    <label htmlFor='take_profit'>
                        <Text as='p' align='left' size='xs' color='prominent'>
                            {localize('Take Profit:')}
                        </Text>
                    </label>
                    <input type='text' value={takeProfitValue} id='take_profit' onChange={handleTpChange} />
                </div>
                <div className='sl'>
                    <label htmlFor='stop_loss'>
                        <Text as='p' align='left' size='xs' color='prominent'>
                            {localize('Stop Loss:')}
                        </Text>
                    </label>
                    <input type='text' value={stopLossValue} id='stop_loss' onChange={handleSlChange} />
                </div>
                <div className='active_inactive'>
                    <label htmlFor='enable_tp_sl'>
                        <Text as='p' align='left' size='xs' color='prominent'>
                            {localize('Enable/Disable')}
                        </Text>
                    </label>
                    <input
                        type='checkbox'
                        checked={enableSlTpValue}
                        id='enable_tp_sl'
                        onChange={handleIsActiveInActive}
                    />
                </div>
                <div className='copy_demo_trades'>
                    <label htmlFor='copy_demo'>
                        <Text as='p' align='left' size='xs' color='prominent'>
                            {localize('Copy Demo Status:')}
                        </Text>
                    </label>
                    <input type='checkbox' checked={enableCopyDemo} id='copy_demo' onChange={handleDemoCopy} />
                </div>

                {enableCopyDemo && (
                    <div className='account_cr'>
                        <label htmlFor='acc_cr'>
                            <Text as='p' align='left' size='xs' color='prominent'>
                                {localize('CR ID:')}
                            </Text>
                        </label>
                        <input type='text' value={liveAccCR} id='acc_cr' onChange={handleLiveAccCrChange} />
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default BotSettings;
