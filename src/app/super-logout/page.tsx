'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from '@/components/UserAvatar';

const fallback = {
  splash: '/fino-assets/super-logout/splash-background.webp',
  wordmark: '/fino-assets/super-logout/fino-pay-wordmark.webp',
  screens: [
    '/fino-assets/super-logout/screen-01.webp',
    '/fino-assets/super-logout/screen-02.webp',
    '/fino-assets/super-logout/screen-03.webp',
    '/fino-assets/super-logout/screen-04.webp',
    '/fino-assets/super-logout/screen-05.webp',
    '/fino-assets/super-logout/screen-06.webp',
    '/fino-assets/super-logout/screen-07.webp',
    '/fino-assets/super-logout/screen-08.webp',
    '/fino-assets/super-logout/screen-09.webp',
    '/fino-assets/super-logout/screen-10.webp',
  ],
};

function displayMobile(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return '+91 ' + digits.slice(2);
  if (digits.length === 10) return '+91 ' + digits;
  return value || 'Mobile number not saved';
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

export default function SuperLogoutPage() {
  const router = useRouter();
  const { appData } = useAppData();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [seconds, setSeconds] = useState(90);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [notificationVisible, setNotificationVisible] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const settings = appData.appSettings;
  const phone = appData.user.contact.phone || '';
  const mobileText = useMemo(() => displayMobile(phone), [phone]);
  const account = appData.accounts.find(item => item.type === 'Savings') || appData.accounts[0];

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
    const enterTimer = window.setTimeout(() => setNotificationVisible(true), 2000);
    return () => window.clearTimeout(enterTimer);
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

  const sendSms = () => {
    if (!phone.trim()) {
      toast({ variant: 'destructive', title: 'Mobile number not saved', description: 'Add your registered mobile number in FinoPay Settings before continuing.' });
      return;
    }
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
    // Keep the IndexedDB pending flag active until the existing MPIN flow succeeds.
    router.replace('/login-1');
  };

  return (
    <main className="fino-superlogout fixed inset-0 flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-black">
      <div className="fino-superlogout-frame relative overflow-hidden bg-white">
        <img src={screens[step - 1]} alt={'FinoPay onboarding screen ' + step} draggable={false} className="absolute inset-0 h-full w-full select-none object-fill" />

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

        {step === 5 && <button aria-label="Send verification SMS" onClick={sendSms} className="absolute bottom-[5.5%] left-[5%] z-10 h-[8%] w-[90%] bg-transparent" />}

        {step === 6 && (
          <div aria-label="Loading" className="fino-page6-loader absolute left-1/2 top-1/2 z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-white/90 border-t-[#4136d0] shadow-[0_0_0_5px_rgba(65,54,208,0.12)]" />
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
                  className="h-full min-w-0 flex-1 rounded-[12px] border border-[#d8ccff] bg-white/90 text-center text-[clamp(12px,3.4vw,16px)] font-semibold text-[#4540a3] outline-none placeholder:text-[#bdbdbd] focus:border-[#5549c4]"
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
          <div aria-label="Redirecting" className="fino-page8-loader absolute left-[34.5%] top-[92.7%] z-20 h-[2.1%] w-[4.8%] rounded-full border-[3px] border-[#e2ddff] border-t-[#5145b2]" />
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
    </main>
  );
}
