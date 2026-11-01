'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock3, LoaderCircle, MessageSquareText, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/hooks/use-app-data';
import UserAvatar from '@/components/UserAvatar';

const introTitles = ['Welcome to FinoPay', 'Banking made simple', 'Secure banking'];

export default function SuperLogoutPage() {
  const router = useRouter();
  const { appData } = useAppData();
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [seconds, setSeconds] = useState(90);
  const [otp, setOtp] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(false);
  const phone = appData.user.contact.phone || 'Mobile number not saved';
  const maskedPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 4 ? digits.slice(0, 2) + '••••••' + digits.slice(-2) : phone;
  }, [phone]);
  const account = appData.accounts[0];

  useEffect(() => {
    if (step !== 7 || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, seconds]);

  useEffect(() => {
    if (step !== 8) return;
    setLoadingProgress(true);
    const timer = window.setTimeout(() => { setLoadingProgress(false); setStep(9); }, 3000);
    return () => window.clearTimeout(timer);
  }, [step]);

  const sendSms = () => {
    if (sending) return;
    setSending(true);
    window.setTimeout(() => { setSending(false); setStep(6); }, 3000);
  };
  const finish = () => {
    window.sessionStorage.removeItem('finoPaySuperLogoutPending');
    router.replace('/login-1');
  };

  return (
    <main className="min-h-[100dvh] w-full overflow-hidden bg-[#f7f8fa] text-[#202a37]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between bg-[#e31e36] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            {appData.appSettings.appLogo ? <img src={appData.appSettings.appLogo} alt="FinoPay logo" className="h-10 w-10 rounded-full bg-white object-contain p-1" /> : <div className="grid h-10 w-10 place-items-center rounded-full bg-white font-bold text-[#e31e36]">F</div>}
            <div className="leading-tight"><div className="text-lg font-semibold">Fino</div><div className="text-xl font-bold">pay</div></div>
          </div>
          <span className="text-xs font-medium opacity-90">Step {step} of 10</span>
        </header>
        <div className="h-1.5 w-full bg-[#f6d9de]"><div className="h-full bg-[#e31e36] transition-all duration-300" style={{ width: (step * 10) + '%' }} /></div>
        <section className="flex flex-1 flex-col px-6 pb-6 pt-8">
          {step <= 3 && <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-8 grid h-44 w-44 place-items-center rounded-full bg-gradient-to-br from-[#fff0f2] to-[#f9cbd2]">
              {appData.appSettings.appLogo ? <img src={appData.appSettings.appLogo} alt="FinoPay" className="h-24 w-24 object-contain" /> : <ShieldCheck className="h-24 w-24 text-[#e31e36]" strokeWidth={1.3} />}
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#e31e36]">FinoPay</p>
            <h1 className="max-w-xs text-2xl font-bold leading-snug">{introTitles[step - 1]}</h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">{step === 1 ? 'A simpler way to manage your banking, securely and conveniently.' : step === 2 ? 'Access your account details and everyday banking services in one place.' : 'Your security matters. Follow the steps to verify your saved details and sign in again.'}</p>
            <div className="mt-8 flex items-center gap-2">{[1, 2, 3].map(item => <span key={item} className={'h-2 rounded-full ' + (item === step ? 'w-7 bg-[#e31e36]' : 'w-2 bg-slate-200')} />)}</div>
            <div className="mt-auto grid w-full grid-cols-2 gap-3 pt-10">
              <Button variant="outline" className="h-12 rounded-xl" onClick={() => setStep(4)}>Skip</Button>
              <Button className="h-12 rounded-xl bg-[#e31e36] hover:bg-[#c91930]" onClick={() => setStep(step + 1)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>}

          {step === 4 && <div className="flex flex-1 flex-col">
            <div className="mb-8 mt-8 text-center"><h1 className="text-2xl font-bold">Welcome to FinoPay</h1><p className="mt-2 text-sm text-slate-500">Choose how you would like to continue.</p></div>
            <div className="space-y-4">
              <button onClick={() => setStep(5)} className="flex w-full items-center gap-4 rounded-2xl border border-[#e31e36]/30 p-5 text-left hover:bg-rose-50"><span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-[#e31e36]"><Smartphone /></span><span className="flex-1"><span className="block font-semibold">Existing User Login</span><span className="mt-1 block text-sm text-slate-500">Verify your registered mobile number</span></span><ChevronRight /></button>
              <button onClick={() => { window.sessionStorage.removeItem('finoPaySuperLogoutPending'); router.replace('/login-1'); }} className="flex w-full items-center gap-4 rounded-2xl border p-5 text-left hover:bg-slate-50"><span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><ArrowRight /></span><span className="flex-1"><span className="block font-semibold">New Registration</span><span className="mt-1 block text-sm text-slate-500">Continue to the app login page</span></span><ChevronRight /></button>
            </div>
            <p className="mt-auto pt-8 text-center text-xs text-slate-400">Your saved profile and account information will be retained.</p>
          </div>}

          {step === 5 && <div className="flex flex-1 flex-col">
            <button onClick={() => setStep(4)} className="mb-8 flex w-fit items-center gap-2 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" /> Back</button>
            <div className="mb-7 grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-[#e31e36]"><MessageSquareText className="h-8 w-8" /></div>
            <h1 className="text-2xl font-bold">Verify your mobile number</h1><p className="mt-3 text-sm leading-6 text-slate-500">We will send a verification SMS to the mobile number registered in your FinoPay settings.</p>
            <div className="mt-6 rounded-xl border bg-slate-50 p-4"><p className="text-xs text-slate-500">Registered mobile number</p><p className="mt-1 font-semibold">{maskedPhone}</p></div>
            <Button disabled={sending} className="mt-6 h-12 rounded-xl bg-[#e31e36] hover:bg-[#c91930]" onClick={sendSms}>{sending ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Sending SMS…</> : 'Send SMS'}</Button>
            <p className="mt-3 text-center text-xs text-slate-400">Please keep this screen open while we process your request.</p>
          </div>}

          {step === 6 && <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-14 w-14" /></div>
            <h1 className="mt-7 text-2xl font-bold">SMS request submitted</h1><p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Continue to the mobile verification step for {maskedPhone}.</p>
            <Button className="mt-8 h-12 w-full rounded-xl bg-[#e31e36] hover:bg-[#c91930]" onClick={() => { setSeconds(90); setStep(7); }}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>}

          {step === 7 && <div className="flex flex-1 flex-col">
            <div className="mb-6 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-[#e31e36]"><Smartphone className="h-8 w-8" /></div><h1 className="mt-4 text-2xl font-bold">Verify your mobile number</h1><p className="mt-2 text-sm text-slate-500">Enter the verification code sent to {maskedPhone}.</p></div>
            <div className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"><Clock3 className="h-4 w-4 text-[#e31e36]" /><span>Time remaining</span><strong className="tabular-nums text-[#e31e36]">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</strong></div>
            <label className="mb-2 text-sm font-medium" htmlFor="superlogout-otp">Verification code</label>
            <input id="superlogout-otp" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Enter OTP" className="h-12 rounded-xl border px-4 text-center text-xl tracking-[0.45em] outline-none focus:border-[#e31e36]" />
            <div className="fino-otp-notification relative mt-6 overflow-hidden rounded-2xl border bg-white p-4 shadow-lg"><div className="absolute inset-x-0 top-0 h-1 bg-[#e31e36] animate-pulse" /><div className="flex items-start gap-3">{appData.appSettings.messageAvatar ? <img src={appData.appSettings.messageAvatar} alt="Saved OTP avatar" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <UserAvatar user={appData.user} />}<div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">FinoPay</p><span className="text-[10px] text-slate-400">now</span></div><p className="mt-1 text-xs leading-5 text-slate-600">Your FinoPay verification request is in progress. Use the OTP from the app's existing verification flow if one has been issued.</p>{otp.length === 6 && <p className="mt-2 text-sm font-semibold tracking-widest">Code entered: {otp.replace(/./g, '•')}</p>}</div></div></div>
            <p className="mt-4 text-center text-xs text-slate-400">This notification is a visual preview; this screen does not generate or send an SMS OTP.</p>
            <Button className="mt-auto h-12 rounded-xl bg-[#e31e36] hover:bg-[#c91930]" onClick={() => setStep(8)}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
            {seconds === 0 && <p className="mt-2 text-center text-xs text-rose-600">The 90-second timer has expired. Continue to proceed.</p>}
          </div>}

          {step === 8 && <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="relative grid h-28 w-28 place-items-center rounded-full bg-rose-50"><LoaderCircle className="h-14 w-14 animate-spin text-[#e31e36]" /></div><h1 className="mt-8 text-2xl font-bold">Verifying your details</h1><p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Please wait while we prepare your account information.</p><div className="mt-8 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4" /> Keep the app open</div>{loadingProgress && <p className="mt-4 text-xs text-slate-400">Please do not close this screen…</p>}</div>}

          {step === 9 && <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-14 w-14" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Verification complete</p><h1 className="mt-2 text-2xl font-bold">Congratulations!</h1><p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">Your saved FinoPay details are ready. Review the information to continue.</p><Button className="mt-8 h-12 w-full rounded-xl bg-[#e31e36] hover:bg-[#c91930]" onClick={() => setStep(10)}>View details <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}

          {step === 10 && <div className="flex flex-1 flex-col">
            <div className="mb-6 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-9 w-9" /></div><h1 className="mt-4 text-2xl font-bold">Your details are confirmed</h1><p className="mt-2 text-sm text-slate-500">These details are taken from your saved FinoPay settings.</p></div>
            <div className="space-y-0 overflow-hidden rounded-2xl border"><div className="flex items-center gap-3 border-b p-4"><UserAvatar user={appData.user} /><div><p className="text-xs text-slate-500">Account holder</p><p className="font-semibold">{appData.user.name || 'Name not saved'}</p></div></div>
              {[['Customer ID', appData.user.customerId || 'Not saved'], ['Registered mobile', phone], ['Account number', account?.accountNumber || 'Not saved'], ['Account type', account?.type || 'Not saved'], ['Branch', account?.branchName || 'Not saved'], ['IFSC', account?.ifsc || 'Not saved']].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 border-b p-4 last:border-0"><span className="text-sm text-slate-500">{label}</span><span className="max-w-[58%] break-words text-right text-sm font-medium">{value}</span></div>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">Continue to the existing MPIN login screen. Your saved app data will not be cleared.</p>
            <Button className="mt-auto h-12 rounded-xl bg-[#e31e36] hover:bg-[#c91930]" onClick={finish}>Proceed to MPIN Login <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>}
        </section>
        <footer className="border-t px-5 py-4 text-center text-[11px] text-slate-400">FinoPay · Secure digital banking</footer>
      </div>
      <style jsx global>{`@keyframes finoOtpSlide { 0% { transform: translateY(-115%); opacity: 0; } 15% { transform: translateY(0); opacity: 1; } 75% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(115%); opacity: 0; } } .fino-otp-notification { animation: finoOtpSlide 4.5s ease-in-out infinite; }`}</style>
    </main>
  );
}
