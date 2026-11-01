'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from '@/components/UserAvatar';
import type { SuperLogoutTokenMessage } from '@/lib/types';

const fallback = {
  screens: [
    '/fino-assets/super-logout/screen-01-iphone.webp',
    '/fino-assets/super-logout/screen-02-iphone.webp',
    '/fino-assets/super-logout/screen-03-iphone.webp',
    '/fino-assets/super-logout/screen-04-iphone.webp',
    '/fino-assets/super-logout/screen-05-iphone.webp',
    '/fino-assets/super-logout/screen-06-iphone.webp',
    '/fino-assets/super-logout/screen-07-iphone.webp',
    '/fino-assets/super-logout/screen-08-iphone.webp',
    '/fino-assets/super-logout/screen-09-iphone.webp',
    '/fino-assets/super-logout/screen-10-iphone.webp',
  ],
  messageScreen: '/fino-assets/super-logout/screen-05-1-clean.webp',
};

const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function createActivationMessage() {
  let token = '';
  while (token.length < 64) {
    const bytes = new Uint8Array(96);
    window.crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      // Rejection sampling keeps all 62 alphanumeric characters equally likely.
      if (byte >= 248) continue;
      token += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length];
      if (token.length === 64) break;
    }
  }
  return 'FINOPBMB' + token;
}

function displayMobile(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'Mobile number not saved';
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (local.length === 10) return '+91 ' + local.slice(0, 5) + ' ' + local.slice(5);
  return value.startsWith('+') ? value : '+' + value;
}

function maskMobile(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? '+91 XXX XXX XX' + digits.slice(-2) : 'Not saved';
}

function maskCustomerId(value: string) {
  if (!value) return 'Not saved';
  return value.length < 3 ? value : '*'.repeat(Math.min(10, value.length - 2)) + value.slice(-2);
}

function maskEmail(value: string) {
  if (!value || !value.includes('@')) return 'Not saved';
  const parts = value.split('@');
  const local = parts[0];
  const domain = parts[1];
  const dot = domain.lastIndexOf('.');
  const provider = dot > 0 ? domain.slice(0, dot) : domain;
  const suffix = dot > 0 ? domain.slice(dot) : '';
  const maskedLocal = local.length < 3 ? local : local[0] + '*'.repeat(Math.min(14, local.length - 2)) + local.slice(-1);
  const maskedProvider = provider.length < 2 ? provider : provider[0] + '***';
  return maskedLocal + '@' + maskedProvider + suffix;
}

function formatTokenMessageDate(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  const dateKey = (value: Date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const dateLabel = dateKey(date) === dateKey(today)
    ? 'Today'
    : dateKey(date) === dateKey(yesterday)
      ? 'Yesterday'
      : new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
        }).format(date);
  const time = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date);
  return dateLabel + ', ' + time;
}

export default function SuperLogoutPage() {
  const router = useRouter();
  const { appData, setAppData } = useAppData();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loadedStep, setLoadedStep] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(90);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [draftMessage, setDraftMessage] = useState('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const settings = appData.appSettings;
  const phone = appData.user.contact.phone || '';
  const mobileText = useMemo(() => displayMobile(phone), [phone]);
  const account = appData.accounts.find(item => item.type === 'Savings') || appData.accounts[0];
  const tokenHistory = settings.superLogoutTokenMessages || [];
  const recentMessages = [...tokenHistory].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)).slice(-4).reverse();

  const screens = [
    settings.superLogoutScreen1 || fallback.screens[0],
    settings.superLogoutScreen2 || fallback.screens[1],
    settings.superLogoutScreen3 || fallback.screens[2],
    settings.superLogoutScreen4 || fallback.screens[3],
    settings.superLogoutScreen5 || fallback.screens[4],
    settings.superLogoutScreen6 || fallback.screens[5],
    settings.superLogoutScreen7 || fallback.screens[6],
    settings.superLogoutScreen8 || fallback.screens[7],
    settings.superLogoutScreen9 || fallback.screens[8],
    settings.superLogoutScreen10 || fallback.screens[9],
  ];
  const messageScreen = settings.superLogoutScreen5_1 || fallback.messageScreen;

  useEffect(() => {
    if (step !== 6) return;
    const timer = window.setTimeout(() => {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedOtp(code);
      setOtp(['', '', '', '']);
      setSeconds(90);
      setNotificationVisible(false);
      setStep(7);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step !== 7 || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, seconds]);

  useEffect(() => {
    if (step !== 7) return;
    const timer = window.setTimeout(() => setNotificationVisible(true), 2000);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (!notificationVisible) return;
    const timer = window.setTimeout(() => setNotificationVisible(false), 3800);
    return () => window.clearTimeout(timer);
  }, [notificationVisible]);

  useEffect(() => {
    if (step !== 8) return;
    const timer = window.setTimeout(() => setStep(9), 4000);
    return () => window.clearTimeout(timer);
  }, [step]);

  const openSmsComposer = () => {
    if (!phone.trim()) {
      toast({ variant: 'destructive', title: 'Mobile number not saved', description: 'Add your registered mobile number in FinoPay Settings before continuing.' });
      return;
    }
    setDraftMessage(createActivationMessage());
    setStep(5.1);
  };

  const sendActivationMessage = () => {
    if (!draftMessage.startsWith('FINOPBMB') || draftMessage.length !== 72) {
      toast({ variant: 'destructive', title: 'Invalid activation message', description: 'A new 64-character activation token could not be prepared. Please try again.' });
      setDraftMessage(createActivationMessage());
      return;
    }
    const record: SuperLogoutTokenMessage = {
      id: 'sms_' + window.crypto.randomUUID(),
      recipient: mobileText,
      message: draftMessage,
      timestamp: new Date().toISOString(),
    };
    setAppData({
      ...appData,
      appSettings: {
        ...settings,
        superLogoutTokenMessages: [...tokenHistory, record],
      },
    });
    setStep(6);
  };

  const changeOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp(current => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const verifyOtp = () => {
    if (seconds <= 0) {
      toast({ variant: 'destructive', title: 'OTP expired', description: 'Request a new verification code to continue.' });
      return;
    }
    if (otp.join('') !== generatedOtp || generatedOtp.length !== 4) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: 'The OTP you entered is incorrect. Please try again.' });
      return;
    }
    setNotificationVisible(false);
    setStep(8);
  };

  const resendOtp = () => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(code);
    setOtp(['', '', '', '']);
    setSeconds(90);
    setNotificationVisible(false);
    window.setTimeout(() => setNotificationVisible(true), 2000);
    inputRefs.current[0]?.focus();
  };

  const finish = () => {
    // Allow this in-app transition to MPIN once. A refresh before successful MPIN
    // verification returns the user to the first Super Logout screen.
    window.sessionStorage.setItem('finoPaySuperLogoutMpinReady', 'true');
    router.replace('/login-1');
  };

  return (
    <main className="fino-superlogout fixed inset-0 flex h-[100dvh] w-[100vw] items-stretch justify-stretch overflow-hidden bg-white">
      <div className="fino-superlogout-frame relative overflow-hidden bg-white">
        {step === 5.1 ? (
          <div
            className={loadedStep === step ? "fino-sms-sheet absolute inset-0" : "invisible absolute inset-0"}
          >
            <img
              src={messageScreen}
              alt="FinoPay SMS composer reference"
              draggable={false}
              onLoad={() => setLoadedStep(step)}
              onError={() => setLoadedStep(step)}
              className="absolute inset-0 h-full w-full select-none object-fill"
            />
            <button aria-label="Cancel message" onClick={() => setStep(5)} className="absolute right-[2%] top-[5.1%] z-20 h-[5.5%] w-[19%] bg-transparent" />
            <div className="absolute left-0 top-[13.1%] z-10 flex h-[4.3%] w-full items-center gap-3 border-b border-[#e5e5e5] bg-white px-[4.2%] text-[clamp(14px,3.8vw,16px)]">
              <span className="shrink-0 text-[#8e8e93]">To:</span>
              <span className="min-w-0 font-medium text-[#28bf58]">{mobileText}</span>
            </div>
            <div className="absolute left-0 top-[19.3%] z-10 flex max-h-[48%] w-full flex-col items-stretch gap-3 overflow-y-auto bg-white px-[4%] pb-2">
              {recentMessages.map(message => (
                <div key={message.id} className="flex w-full flex-col items-stretch gap-1">
                  <div className="flex w-full flex-col items-center bg-white text-center text-[clamp(10px,2.9vw,13px)] leading-tight text-[#8e8e93]">
                    <span>Text Message • SMS</span>
                    <span>{formatTokenMessageDate(message.timestamp)}</span>
                  </div>
                  <div className="ml-auto w-fit max-w-[96%] rounded-[26px] bg-[#2fc45d] px-4 py-3 text-left text-[clamp(12px,3.5vw,16px)] leading-[1.35] text-white shadow-sm">
                    <p className="break-all whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute left-[18.4%] top-[85.4%] z-10 h-[8.7%] w-[66%] overflow-hidden bg-white px-1 pt-1 text-[clamp(12px,3.5vw,16px)] leading-[1.35] text-black">
              <p className="break-all whitespace-pre-wrap">{draftMessage}</p>
            </div>
            <button aria-label="Send activation SMS" onClick={sendActivationMessage} className="absolute right-[3.2%] top-[90.5%] z-20 h-[6.2%] w-[10%] rounded-full bg-transparent" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{ visibility: loadedStep === step ? 'visible' : 'hidden' }}
          >
            <img
              key={step}
              src={step === 6 ? screens[4] : screens[Math.floor(step) - 1]}
              alt={step === 6 ? 'Verifying mobile number' : 'FinoPay onboarding screen ' + step}
              draggable={false}
              onLoad={() => setLoadedStep(step)}
              onError={() => setLoadedStep(step)}
              className="absolute inset-0 h-full w-full select-none object-fill"
              style={step === 6 ? { filter: 'brightness(0.38)' } : undefined}
            />

            {step >= 1 && step <= 3 && (
              <>
                <button aria-label="Skip onboarding" onClick={() => setStep(4)} className="absolute left-[5%] top-[89%] z-10 h-[8%] w-[27%] bg-transparent" />
                <button aria-label="Next onboarding screen" onClick={() => setStep(step + 1)} className="absolute right-[4%] top-[89%] z-10 h-[8%] w-[25%] bg-transparent" />
              </>
            )}

            {step === 4 && (
              <>
                <button aria-label="Existing customer login" onClick={() => setStep(5)} className="absolute left-[6%] top-[35.5%] z-10 h-[13.5%] w-[88%] bg-transparent" />
                <button aria-label="New customer registration" onClick={() => toast({ title: 'New registration', description: 'New account registration is separate from this existing-customer Super Logout flow.' })} className="absolute left-[6%] top-[50.5%] z-10 h-[13.5%] w-[88%] bg-transparent" />
              </>
            )}

            {step === 5 && <button aria-label="Send verification SMS" onClick={openSmsComposer} className="absolute bottom-[5.5%] left-[5%] z-10 h-[8%] w-[90%] bg-transparent" />}

            {step === 6 && (
              <div aria-label="Loading" className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
                <div className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-white shadow-[0_8px_32px_rgba(0,0,0,0.22)]">
                  <div className="fino-page6-loader h-10 w-10 rounded-full border-[4px] border-[#e7e5ff] border-t-[#4136d0]" />
                </div>
              </div>
            )}

            {step === 7 && (
              <>
                <button aria-label="Back to SMS verification" onClick={() => setStep(5)} className="absolute left-[5%] top-[7%] z-10 h-[7%] w-[20%] bg-transparent" />
                <div className="absolute left-[9%] top-[33.1%] z-10 flex h-[3.5%] w-[82%] items-center justify-center bg-white px-1 text-center text-[clamp(9px,2.8vw,12px)] font-normal text-[#454545]">
                  Enter the OTP sent to {mobileText}
                </div>
                <div className="absolute left-[16.4%] top-[38.1%] z-10 flex h-[7.8%] w-[67.2%] gap-[3.2%]">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={element => { inputRefs.current[index] = element; }}
                      aria-label={'OTP digit ' + (index + 1)}
                      value={digit}
                      onChange={event => changeOtp(index, event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
                        if (event.key === 'Enter') verifyOtp();
                      }}
                      onPaste={event => {
                        const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
                        if (pasted.length) {
                          event.preventDefault();
                          setOtp([pasted[0] || '', pasted[1] || '', pasted[2] || '', pasted[3] || '']);
                          inputRefs.current[Math.min(pasted.length - 1, 3)]?.focus();
                        }
                      }}
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      placeholder="–"
                      style={{ fontSize: '16px', touchAction: 'manipulation' }}
                      className="h-full min-w-0 flex-1 rounded-[12px] border border-[#d8ccff] bg-white/90 text-center font-semibold text-[#4540a3] outline-none placeholder:text-[#bdbdbd] focus:border-[#5549c4]"
                    />
                  ))}
                </div>
                <div className="absolute left-[20.5%] top-[48.5%] z-10 flex h-[3.5%] w-[31%] items-center bg-white text-[clamp(11px,3vw,14px)] text-[#999999]">
                  {seconds} sec
                </div>
                {seconds <= 0 && <button aria-label="Resend OTP" onClick={resendOtp} className="absolute left-[18%] top-[52.5%] z-10 h-[4%] w-[35%] bg-transparent" />}
                <button
                  aria-label="Verify OTP"
                  onClick={verifyOtp}
                  disabled={otp.join('').length !== 4 || seconds <= 0}
                  className="absolute bottom-[6.6%] left-[7%] z-20 flex h-[5.8%] w-[86%] items-center justify-center rounded-full text-[clamp(13px,3.6vw,16px)] font-semibold text-white transition-colors disabled:cursor-not-allowed"
                  style={{ backgroundColor: otp.join('').length === 4 && seconds > 0 ? '#4137d0' : '#a5a0e9' }}
                >
                  Verify
                </button>
                {notificationVisible && (
                  <div className="fino-otp-push absolute left-[2%] top-[2%] z-30 flex w-[96%] items-center gap-3 rounded-[22px] bg-[#171719] px-4 py-3 text-white shadow-2xl">
                    {settings.messageAvatar ? <img src={settings.messageAvatar} alt="Saved OTP avatar" className="h-11 w-11 shrink-0 rounded-full border border-white/20 object-cover" /> : <UserAvatar user={appData.user} className="h-11 w-11" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-bold">VM-FINOBK</p><span className="text-[11px] text-white/60">now</span></div>
                      <p className="mt-0.5 text-[12px] leading-[1.35] text-white/90">Dear Customer, Your OTP is {generatedOtp} and is valid for only 90 sec. Do not share it with anyone.</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 8 && (
              <>
                <div className="absolute left-[9%] top-[33.1%] z-10 flex h-[3.5%] w-[82%] items-center justify-center bg-transparent px-1 text-center text-[clamp(9px,2.8vw,12px)] text-[#686868]">
                  Enter the OTP sent to {mobileText}
                </div>
              </>
            )}

            {step === 9 && <button aria-label="Continue after successful registration" onClick={() => setStep(10)} className="absolute bottom-[5.5%] left-[8%] z-10 h-[8%] w-[84%] bg-transparent" />}

            {step === 10 && (
              <>
                <section className="fino-details-card absolute left-[4.5%] top-[31%] z-10 h-[23.5%] w-[91%] rounded-[24px] px-[4.3%] text-white">
                  <h1 className="absolute left-0 right-0 top-[12%] text-center text-[clamp(12px,3.2vw,15px)] font-bold">{appData.user.name || 'Account holder'}</h1>
                  <div className="absolute left-[4.5%] right-[4.5%] top-[35%] flex items-center justify-between gap-2 text-[clamp(9px,2.7vw,12px)]">
                    <span className="text-[#c2b5df]">Customer ID</span><strong className="text-right">{maskCustomerId(appData.user.customerId)}</strong>
                  </div>
                  <div className="absolute left-[4.5%] right-[4.5%] top-[55%] flex items-center justify-between gap-2 text-[clamp(9px,2.6vw,11px)]">
                    <span className="text-[#c2b5df]">Email</span><strong className="max-w-[62%] break-all text-right">{maskEmail(appData.user.contact.email)}</strong>
                  </div>
                  <div className="absolute left-[4.5%] right-[4.5%] top-[77%] flex items-center justify-between gap-2 text-[clamp(9px,2.7vw,12px)]">
                    <span className="text-[#c2b5df]">Phone</span><strong className="text-right">{maskMobile(phone)}</strong>
                  </div>
                  <div className="absolute left-[4.5%] right-[4.5%] top-[48%] h-px bg-white/50" />
                  <div className="absolute left-[4.5%] right-[4.5%] top-[69%] h-px bg-white/50" />
                  <span className="sr-only">Account: {account?.accountNumber || 'Not saved'}, {account?.type || 'Not saved'}, {account?.branchName || 'Not saved'}</span>
                </section>
                <button aria-label="Proceed to MPIN login" onClick={finish} className="absolute bottom-[5.5%] left-[8%] z-20 h-[8%] w-[84%] bg-transparent" />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
