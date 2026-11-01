
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAppData } from '@/hooks/use-app-data';
import type { AppData, Transaction, Payee, ChatMessage, Account } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Trash2, Upload, Download, Loader2, PlusCircle, RefreshCw, Link as LinkIcon, Copy, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseFinoStatement, applyStatementToAppData, type ParsedStatement } from '@/lib/statement-import';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/UserAvatar';
import { setSuperLogoutPending } from '@/lib/super-logout-state';

function formatSuperLogoutMessageDate(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    const dateKey = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const label = dateKey(date) === dateKey(today) ? 'Today' : dateKey(date) === dateKey(yesterday) ? 'Yesterday' : new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    const time = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
    return `${label}, ${time} IST`;
}

function SettingsSection({ title, description, children, defaultOpen = false }: { title: string, description?: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer">
                    <CollapsibleTrigger asChild>
                      <div className="flex-1">
                          <CardTitle className="text-lg">{title}</CardTitle>
                          {description && <CardDescription className="text-xs mt-1">{description}</CardDescription>}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                            {isOpen ? <ChevronUp /> : <ChevronDown />}
                            <span className="sr-only">Toggle</span>
                        </Button>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="p-4 pt-0 space-y-4">
                        {children}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

function FileUpload({ label, onFileSelect, currentImage, accept }: { label: string, onFileSelect: (dataUri: string) => void, currentImage?: string, accept: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onFileSelect(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-4">
                {currentImage && <img src={currentImage} alt="current" className="h-12 w-auto max-w-[100px] object-contain rounded-md border" />}
                <Input type="file" accept={accept} onChange={handleFileChange} ref={inputRef} className="hidden" />
                <Button variant="outline" onClick={() => inputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4"/>
                    Upload
                </Button>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { appData, setAppData } = useAppData();
    const { toast } = useToast();
    const [localData, setLocalData] = useState<AppData>(appData);
    const [isExtracting, setIsExtracting] = useState(false);
    const [parsedStatement, setParsedStatement] = useState<ParsedStatement | null>(null);
    const importRef = useRef<HTMLInputElement>(null);
    const [adjustmentAmounts, setAdjustmentAmounts] = useState<Record<string, number>>({});
    const [exportLink, setExportLink] = useState('');
    const [isExportLinkDialogOpen, setIsExportLinkDialogOpen] = useState(false);
    const [isJsonViewerOpen, setIsJsonViewerOpen] = useState(false);

    const handleSave = () => {
        setAppData(localData);
        toast({ title: "Settings Saved", description: "Your changes have been applied." });
    };

    const handleFieldChange = (section: keyof AppData, field: any, value: any) => {
        setLocalData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    const handleContactChange = (field: keyof AppData['user']['contact'], value: string) => {
        setLocalData(prev => ({
            ...prev,
            user: {
                ...prev.user,
                contact: {
                    ...prev.user.contact,
                    [field]: value
                }
            }
        }));
    };
    
    const handleAccountChange = (index: number, field: keyof AppData['accounts'][0], value: any) => {
        const newAccounts = [...localData.accounts];
        (newAccounts[index] as any)[field] = value;
        setLocalData(prev => ({...prev, accounts: newAccounts}));
    }

    const handleAdjustBalance = (index: number, operation: 'add' | 'subtract') => {
        const amountToAdjust = adjustmentAmounts[localData.accounts[index].id] || 0;
        if (amountToAdjust <= 0) {
            toast({ variant: 'destructive', title: "Invalid Amount", description: "Please enter a positive amount to adjust." });
            return;
        }

        const currentBalance = localData.accounts[index].balance;
        const newBalance = operation === 'add' ? currentBalance + amountToAdjust : currentBalance - amountToAdjust;
        
        handleAccountChange(index, 'balance', newBalance);
    };

    const handleTxnChange = (index: number, field: keyof Transaction, value: any) => {
        const newTxns = [...localData.transactions];
        (newTxns[index] as any)[field] = value;
        setLocalData(prev => ({...prev, transactions: newTxns}));
    }

    const addTransaction = () => {
        const newTxn: Transaction = {
            id: `txn_${Date.now()}`,
            date: new Date().toISOString(),
            description: 'New Transaction',
            amount: 0,
            type: 'debit',
            category: 'Other',
            balanceAfter: localData.accounts.find(a => a.type === 'Savings')?.balance || 0,
        };
        setLocalData(prev => ({...prev, transactions: [newTxn, ...prev.transactions]}));
    }

    const removeTransaction = (id: string) => {
        setLocalData(prev => ({...prev, transactions: prev.transactions.filter(t => t.id !== id)}));
    }
    
    const handlePayeeChange = (index: number, field: keyof Payee, value: any) => {
        const newPayees = [...localData.payees];
        (newPayees[index] as any)[field] = value;
        setLocalData(prev => ({...prev, payees: newPayees}));
    }

    const addPayee = () => {
        const newPayee: Payee = {
            id: `payee_${Date.now()}`,
            name: 'New Payee',
            upiId: '',
            avatar: '',
        };
        setLocalData(prev => ({...prev, payees: [newPayee, ...appData.payees]}));
    }

    const removePayee = (id: string) => {
        setLocalData(prev => ({...prev, payees: prev.payees.filter(p => p.id !== id)}));
    }

    const handleChatMessageChange = (index: number, field: keyof ChatMessage, value: any) => {
        const newMessages = [...localData.chatMessages];
        (newMessages[index] as any)[field] = value;
        setLocalData(prev => ({...prev, chatMessages: newMessages}));
    }

    const addChatMessage = () => {
        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            sender: 'user',
            content: 'New message',
            timestamp: new Date().toISOString(),
        };
        setLocalData(prev => ({...prev, chatMessages: [...prev.chatMessages, newMessage]}));
    }

    const removeChatMessage = (id: string) => {
        setLocalData(prev => ({...prev, chatMessages: prev.chatMessages.filter(m => m.id !== id)}));
    }

    const updateTokenMessageHistory = (messages: NonNullable<AppData['appSettings']['superLogoutTokenMessages']>) => {
        setLocalData(prev => ({
            ...prev,
            appSettings: { ...prev.appSettings, superLogoutTokenMessages: messages },
        }));
        setAppData({
            ...appData,
            appSettings: { ...appData.appSettings, superLogoutTokenMessages: messages },
        });
    };

    const removeTokenMessage = (id: string) => {
        const messages = (localData.appSettings.superLogoutTokenMessages || []).filter(message => message.id !== id);
        updateTokenMessageHistory(messages);
        toast({ title: 'Token message deleted', description: 'The selected saved token message has been removed.' });
    };

    const removeAllTokenMessages = () => {
        updateTokenMessageHistory([]);
        toast({ title: 'Token history cleared', description: 'All saved Super Logout token messages have been deleted.' });
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target?.result as string);
                    setLocalData(importedData);
                    toast({ title: "Import Successful", description: "Data loaded. Click 'Save All Changes' to apply." });
                } catch (err) {
                    toast({ variant: 'destructive', title: "Import Failed", description: "Invalid JSON file." });
                }
            };
            reader.readAsText(file);
        }
    };
    
    const createExportSnapshot = async (): Promise<AppData> => {
        // Make the backup portable: embed app visuals as data URIs instead of leaving
        // relative /fino-assets paths or remote image URLs that may not exist elsewhere.
        const embedImage = async (value?: string): Promise<string> => {
            if (!value || value.startsWith('data:') || value.startsWith('blob:')) return value || '';
            try {
                const response = await fetch(new URL(value, window.location.origin).toString());
                if (!response.ok) return value;
                const blob = await response.blob();
                return await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image conversion failed'));
                    reader.onerror = () => reject(reader.error || new Error('Image conversion failed'));
                    reader.readAsDataURL(blob);
                });
            } catch {
                // Keep the original URL if the remote host blocks browser access.
                return value;
            }
        };

        const snapshot: AppData = {
            ...localData,
            user: { ...localData.user, profilePicture: await embedImage(localData.user.profilePicture) },
            payees: await Promise.all(localData.payees.map(async payee => ({
                ...payee,
                avatar: await embedImage(payee.avatar),
            }))),
            appSettings: {
                ...localData.appSettings,
                superLogoutTokenMessages: (localData.appSettings.superLogoutTokenMessages || []).map(message => ({ ...message })),
            },
        };
        const visualKeys: (keyof AppData['appSettings'])[] = [
            'loginBanner', 'getStatementBanner', 'dashboardBanner', 'appLogo', 'appLogo2',
            'messageAvatar', 'qrCodeImage', 'personalLoanBanner', 'twoWheelerLoanBanner',
            'statementHeaderBanner', 'statementMiddleBanner', 'superLogoutSplash', 'superLogoutWordmark',
            'superLogoutScreen1', 'superLogoutScreen2', 'superLogoutScreen3', 'superLogoutScreen4',
            'superLogoutScreen5', 'superLogoutScreen5_1', 'superLogoutScreen6', 'superLogoutScreen7', 'superLogoutScreen8',
            'superLogoutScreen9', 'superLogoutScreen10',
        ];
        for (const key of visualKeys) {
            const value = snapshot.appSettings[key];
            if (typeof value === 'string') {
                (snapshot.appSettings as unknown as Record<string, unknown>)[key] = await embedImage(value);
            }
        }
        snapshot.appSettings.promoBanners = await Promise.all(
            (localData.appSettings.promoBanners || []).map(async banner => ({
                ...banner,
                image: await embedImage(banner.image),
            }))
        );
        return snapshot;
    };

    const handleExport = async () => {
        const exportData = await createExportSnapshot();
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fino-pay-data-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportByLink = async () => {
        const exportData = await createExportSnapshot();
        const jsonString = JSON.stringify(exportData);
        // Solution for btoa with Unicode characters: https://stackoverflow.com/a/30106551
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        const dataUri = `data:application/json;base64,${base64Data}`;
        
        // Construct an HTML page that triggers a download.
        const downloadHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Downloading FinoPay Data</title>
                <script>
                    function download() {
                        const a = document.createElement('a');
                        a.href = "${dataUri}";
                        a.download = 'fino-pay-data.json';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        document.getElementById('message').innerText = 'Download initiated successfully!';
                    }
                    window.onload = download;
                </script>
            </head>
            <body>
                <p id="message">Your download should start automatically...</p>
            </body>
            </html>
        `;
        const htmlBlob = new Blob([downloadHtml], { type: 'text/html' });
        const htmlDataUri = URL.createObjectURL(htmlBlob);
        
        setExportLink(htmlDataUri);
        setIsExportLinkDialogOpen(true);
    };

    const copyExportLink = () => {
        navigator.clipboard.writeText(exportLink);
        toast({ title: 'Link Copied', description: 'The export link has been copied to your clipboard.' });
    };

    const handleReset = () => {
        const STORAGE_KEY = 'finoPayAppData';
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    };

    const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'PDF too large', description: 'Please choose a statement under 20 MB.' });
            event.target.value = '';
            return;
        }
        setIsExtracting(true);
        setParsedStatement(null);
        try {
            const parsed = await parseFinoStatement(await file.arrayBuffer());
            setParsedStatement(parsed);
            toast({ title: 'Statement extracted', description: `${parsed.transactions.length} transactions found. Review the details and choose an import action.` });
        } catch (error) {
            console.error('PDF extraction failed', error);
            toast({ variant: 'destructive', title: 'Extraction failed', description: error instanceof Error ? error.message : 'Could not read this statement PDF.' });
        } finally {
            setIsExtracting(false);
            event.target.value = '';
        }
    };

    const applyParsedStatement = (mode: 'replace-app' | 'replace-transactions' | 'save-transactions') => {
        if (!parsedStatement) return;
        const nextData = applyStatementToAppData(appData, parsedStatement, mode);
        setLocalData(nextData);
        setAppData(nextData);
        const message = mode === 'replace-app' ? 'Profile, main account details, balance, and transactions replaced. App visuals and other collections were preserved.'
            : mode === 'replace-transactions' ? 'Existing transactions replaced; profile and account details were left unchanged.'
            : 'New statement transactions saved alongside existing transactions; duplicates were skipped.';
        toast({ title: 'Statement saved', description: `${message} Imported ${parsedStatement.transactions.length} statement rows.` });
        setParsedStatement(null);
    };

    const copyJsonToClipboard = async () => {
        const exportData = await createExportSnapshot();
        const jsonString = JSON.stringify(exportData, null, 2);
        await navigator.clipboard.writeText(jsonString);
        toast({ title: 'JSON Copied', description: 'App data and embedded visual assets have been copied to your clipboard.' });
    };

    return (
      <>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Developer Settings</h1>
            <Button onClick={handleSave} size="lg">Save All Changes</Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Use this page to manage the mock data for the prototype in real-time. Changes are saved to your browser's local storage.
          </p>
          
          <SettingsSection title="Data Management" description="Save, load, or reset the entire app state.">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => setIsJsonViewerOpen(true)}>
                <Eye className="mr-2 h-4 w-4"/> View JSON
              </Button>
               <Button variant="outline" onClick={copyJsonToClipboard}>
                <Copy className="mr-2 h-4 w-4"/> Copy JSON
              </Button>
              <Button variant="outline" onClick={() => importRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4"/> Import JSON
              </Button>
              <Input type="file" accept=".json" onChange={handleImport} ref={importRef} className="hidden" />
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4"/> Export JSON
              </Button>
               <Button variant="outline" onClick={handleExportByLink}>
                <LinkIcon className="mr-2 h-4 w-4"/> Export by Link
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <RefreshCw className="mr-2 h-4 w-4" /> Reset App to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all current app data from your browser and restore the initial default data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Yes, reset app</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </SettingsSection>

          <SettingsSection title="Security & MPIN" description="Set and save the four-digit login MPIN on this device. It is included in the JSON backup.">
            <div className="space-y-2">
              <Label htmlFor="user-mpin">Login MPIN (4 digits)</Label>
              <Input id="user-mpin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={4}
                value={localData.user.pin || ''}
                onChange={e => { const value = e.target.value; if (/^\d{0,4}$/.test(value)) handleFieldChange('user', 'pin', value); }}
                placeholder="Enter a 4-digit MPIN" />
              <p className="text-xs text-muted-foreground">Choose Save All Changes to apply it. The demo login will check this MPIN. Keep exported backups private because they contain the MPIN and personal data.</p>
            </div>
          </SettingsSection>

          <SettingsSection title="User Details" description="Edit user profile information.">
            <div className="space-y-2">
              <Label htmlFor="userName">User Name</Label>
              <Input id="userName" value={localData.user.name} onChange={e => handleFieldChange('user', 'name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input id="customerId" value={localData.user.customerId} onChange={e => handleFieldChange('user', 'customerId', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" value={localData.user.dob || ''} onChange={e => handleFieldChange('user', 'dob', e.target.value)} placeholder="DD/MM/YYYY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN Number</Label>
              <Input id="pan" value={localData.user.pan || ''} onChange={e => handleFieldChange('user', 'pan', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={localData.user.contact.email} onChange={e => handleContactChange('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={localData.user.contact.phone} onChange={e => handleContactChange('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={localData.user.contact.address || ''} onChange={e => handleContactChange('address', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input id="upiId" value={localData.user.upiId} onChange={e => handleFieldChange('user', 'upiId', e.target.value)} />
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <Label>Account Avatar Variant</Label>
              <Select
                value={localData.user.avatarVariant || 'purple'}
                onValueChange={(value: NonNullable<AppData['user']['avatarVariant']>) => handleFieldChange('user', 'avatarVariant', value)}
              >
                <SelectTrigger><SelectValue placeholder="Choose avatar style" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purple">Classic Purple (KM style)</SelectItem>
                  <SelectItem value="blue">Ocean Blue</SelectItem>
                  <SelectItem value="green">Emerald Green</SelectItem>
                  <SelectItem value="orange">Sunset Orange</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3">
                <UserAvatar user={localData.user} className="h-14 w-14 text-lg" />
                <div className="min-w-0">
                  <p className="font-semibold">{localData.user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">Initials update automatically when the name changes.</p>
                </div>
              </div>
              <FileUpload
                label="Upload Custom Avatar Image"
                accept="image/*"
                currentImage={localData.user.profilePicture}
                onFileSelect={uri => handleFieldChange('user', 'profilePicture', uri)}
              />
              {localData.user.profilePicture && (
                <Button type="button" variant="outline" size="sm" onClick={() => handleFieldChange('user', 'profilePicture', '')}>
                  Use Initials Avatar
                </Button>
              )}
              <p className="text-xs text-muted-foreground">The selected color and initials style are used anywhere the profile avatar appears. An uploaded image takes priority until you switch back to initials.</p>
            </div>
          </SettingsSection>

          <SettingsSection title="App Visuals" description="Customize logo and banners.">
              <FileUpload label="App Logo" accept="image/*" currentImage={localData.appSettings.appLogo} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, appLogo: uri}}))} />
              <FileUpload label="App Logo 2" accept="image/*" currentImage={localData.appSettings.appLogo2} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, appLogo2: uri}}))} />
              <FileUpload label="Login Banner" accept="image/*" currentImage={localData.appSettings.loginBanner} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, loginBanner: uri}}))} />
              <FileUpload label="Get Statement Banner" accept="image/*" currentImage={localData.appSettings.getStatementBanner} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, getStatementBanner: uri}}))} />
              <FileUpload label="Message Avatar (for OTP)" accept="image/*" currentImage={localData.appSettings.messageAvatar} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, messageAvatar: uri}}))} />
              <FileUpload label="Dashboard Banner" accept="image/*" currentImage={localData.appSettings.dashboardBanner} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, dashboardBanner: uri}}))} />
              <FileUpload label="QR Code" accept="image/*" currentImage={localData.appSettings.qrCodeImage} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, qrCodeImage: uri}}))} />
              <FileUpload label="Personal Loan Banner" accept="image/*" currentImage={localData.appSettings.personalLoanBanner} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, personalLoanBanner: uri}}))} />
              <FileUpload label="Two Wheeler Loan Banner" accept="image/*" currentImage={localData.appSettings.twoWheelerLoanBanner} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, twoWheelerLoanBanner: uri}}))} />
              <FileUpload label="Statement Header Banner" accept="image/*" currentImage={localData.appSettings.statementHeaderBanner} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, statementHeaderBanner: uri}}))} />
              <FileUpload label="Statement Middle Banner" accept="image/*" currentImage={localData.appSettings.statementMiddleBanner} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, statementMiddleBanner: uri}}))} />
          </SettingsSection>

          <SettingsSection title="Super Logout Reference Images" description="These reference images control the Super Logout splash and all ten onboarding and verification screens. Uploaded images are included in JSON exports.">
              <FileUpload label="Super Logout Splash Background" accept="image/*" currentImage={localData.appSettings.superLogoutSplash} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutSplash: uri}}))} />
              <FileUpload label="FinoPay Wordmark (Splash and Screens)" accept="image/*" currentImage={localData.appSettings.superLogoutWordmark} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutWordmark: uri}}))} />
              <FileUpload label="Reference Screen 1" accept="image/*" currentImage={localData.appSettings.superLogoutScreen1} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen1: uri}}))} />
              <FileUpload label="Reference Screen 2" accept="image/*" currentImage={localData.appSettings.superLogoutScreen2} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen2: uri}}))} />
              <FileUpload label="Reference Screen 3" accept="image/*" currentImage={localData.appSettings.superLogoutScreen3} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen3: uri}}))} />
              <FileUpload label="Reference Screen 4" accept="image/*" currentImage={localData.appSettings.superLogoutScreen4} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen4: uri}}))} />
              <FileUpload label="Reference Screen 5" accept="image/*" currentImage={localData.appSettings.superLogoutScreen5} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen5: uri}}))} />
              <FileUpload label="Reference Screen 6" accept="image/*" currentImage={localData.appSettings.superLogoutScreen6} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen6: uri}}))} />
              <FileUpload label="Reference Screen 7" accept="image/*" currentImage={localData.appSettings.superLogoutScreen7} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen7: uri}}))} />
              <FileUpload label="Reference Screen 8" accept="image/*" currentImage={localData.appSettings.superLogoutScreen8} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen8: uri}}))} />
              <FileUpload label="Reference Screen 9" accept="image/*" currentImage={localData.appSettings.superLogoutScreen9} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen9: uri}}))} />
              <FileUpload label="Reference Screen 10" accept="image/*" currentImage={localData.appSettings.superLogoutScreen10} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen10: uri}}))} />
              <FileUpload label="SMS Composer Reference (Page 5.1)" accept="image/*" currentImage={localData.appSettings.superLogoutScreen5_1} onFileSelect={uri => setLocalData(p => ({...p, appSettings: {...p.appSettings, superLogoutScreen5_1: uri}}))} />
          </SettingsSection>
          
          <SettingsSection title="Super Logout Token Message History" description="Saved activation messages and timestamps in Indian Standard Time (IST)." defaultOpen>
              <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Messages saved: {(localData.appSettings.superLogoutTokenMessages || []).length}</p>
                  {(localData.appSettings.superLogoutTokenMessages || []).length > 0 && (
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button type="button" variant="destructive" size="sm">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete all
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Delete all saved token messages?</AlertDialogTitle>
                                  <AlertDialogDescription>This permanently removes the saved Super Logout token messages and their timestamps from this device. Export a backup first if you need to keep a copy.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={removeAllTokenMessages}>Delete all messages</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  )}
              </div>
              {(localData.appSettings.superLogoutTokenMessages || []).length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No activation messages have been sent yet.</p>
              ) : (
                  <div className="max-h-[520px] space-y-3 overflow-y-auto">
                      {[...(localData.appSettings.superLogoutTokenMessages || [])].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).map(message => (
                          <div key={message.id} className="space-y-2 rounded-xl border p-3">
                              <div className="flex items-center justify-between gap-2">
                                  <div className="flex min-w-0 flex-wrap gap-2 text-xs text-muted-foreground">
                                      <span>{formatSuperLogoutMessageDate(message.timestamp)}</span>
                                      <span>{message.recipient}</span>
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" aria-label="Delete token message" title="Delete token message" onClick={() => removeTokenMessage(message.id)}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </div>
                              <p className="break-all rounded-lg bg-muted p-3 font-mono text-xs leading-5">{message.message}</p>
                          </div>
                      ))}
                  </div>
              )}
          </SettingsSection>

          <SettingsSection title="Account Details" description="Manage account numbers and balances.">
              {localData.accounts.map((acc, index) => (
                  <div key={acc.id} className="p-4 border rounded-md space-y-3">
                      <h4 className="font-semibold">{acc.type} Account</h4>
                      <div className="space-y-2">
                          <Label>A/c Variant</Label>
                          <Input
                              value={acc.variant ?? ''}
                              placeholder="Enter account variant"
                              onChange={e => handleAccountChange(index, 'variant', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Type any account variant. Changes apply when you save settings.</p>
                      </div>
                      <div className="space-y-2">
                          <Label>A/c Type</Label>
                          <Input
                              value={acc.type ?? ''}
                              placeholder="Enter account type"
                              onChange={e => handleAccountChange(index, 'type', e.target.value as Account['type'])}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input value={acc.accountNumber} onChange={e => handleAccountChange(index, 'accountNumber', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label>Balance</Label>
                          <Input type="number" value={acc.balance} onChange={e => handleAccountChange(index, 'balance', parseFloat(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                          <Label>Adjust Balance</Label>
                          <div className="flex items-center gap-2">
                              <Input 
                                  type="number" 
                                  placeholder="Amount" 
                                  onChange={e => setAdjustmentAmounts(prev => ({ ...prev, [acc.id]: parseFloat(e.target.value) || 0 }))}
                              />
                              <Button variant="outline" onClick={() => handleAdjustBalance(index, 'add')}>Add</Button>
                              <Button variant="outline" onClick={() => handleAdjustBalance(index, 'subtract')}>Subtract</Button>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label>IFSC Code</Label>
                          <Input value={acc.ifsc || ''} onChange={e => handleAccountChange(index, 'ifsc', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label>Branch Name</Label>
                          <Input value={acc.branchName || ''} onChange={e => handleAccountChange(index, 'branchName', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                          <Label>Nominee</Label>
                          <Input value={acc.nominee || ''} onChange={e => handleAccountChange(index, 'nominee', e.target.value)} />
                      </div>
                  </div>
              ))}
          </SettingsSection>
          
          <SettingsSection title="Payees / Beneficiaries" description="Add, edit, or delete payees.">
              <Button onClick={addPayee} className="mb-4">
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Payee
              </Button>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {localData.payees.map((payee, index) => (
                      <div key={payee.id} className="p-3 border rounded-lg space-y-3">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold">{payee.name}</p>
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => removePayee(payee.id)}>
                              <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <Label>Name</Label>
                                  <Input value={payee.name} onChange={e => handlePayeeChange(index, 'name', e.target.value)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>Nickname</Label>
                                  <Input value={payee.nickname || ''} onChange={e => handlePayeeChange(index, 'nickname', e.target.value)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>UPI ID</Label>
                                  <Input value={payee.upiId} onChange={e => handlePayeeChange(index, 'upiId', e.target.value)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>Account Number</Label>
                                  <Input value={payee.accountNumber || ''} onChange={e => handlePayeeChange(index, 'accountNumber', e.target.value)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>Bank Name</Label>
                                  <Input value={payee.bankName || ''} onChange={e => handlePayeeChange(index, 'bankName', e.target.value)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>IFSC</Label>
                                  <Input value={payee.ifsc || ''} onChange={e => handlePayeeChange(index, 'ifsc', e.target.value)}/>
                              </div>
                              <div className="col-span-2">
                                  <FileUpload 
                                      label="Avatar" 
                                      accept="image/*" 
                                      currentImage={payee.avatar} 
                                      onFileSelect={uri => handlePayeeChange(index, 'avatar', uri)} 
                                  />
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </SettingsSection>
          
          <SettingsSection title="Transactions (Passbook)" description="Add, edit, or delete transactions.">
              <Button onClick={addTransaction} className="mb-4">
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Transaction
              </Button>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {localData.transactions.map((txn, index) => (
                      <div key={txn.id} className="p-3 border rounded-lg space-y-3">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold">{txn.description}</p>
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => removeTransaction(txn.id)}>
                              <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                  <Label>Description</Label>
                                  <Input value={txn.description} onChange={e => handleTxnChange(index, 'description', e.target.value)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>To (Payee Name or UPI ID)</Label>
                                  <Input value={txn.to || ''} onChange={e => handleTxnChange(index, 'to', e.target.value)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>Date (ISO Format)</Label>
                                  <Input
                                      type="text"
                                      placeholder="e.g., 2024-01-01T12:00:00.000Z"
                                      value={txn.date || ''}
                                      onChange={e => handleTxnChange(index, 'date', e.target.value)}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <Label>Amount</Label>
                                  <Input type="number" value={txn.amount} onChange={e => handleTxnChange(index, 'amount', parseFloat(e.target.value) || 0)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>Balance After</Label>
                                  <Input type="number" value={txn.balanceAfter} onChange={e => handleTxnChange(index, 'balanceAfter', parseFloat(e.target.value) || 0)}/>
                              </div>
                              <div className="space-y-1">
                                  <Label>Type</Label>
                                  <Select value={txn.type} onValueChange={(v: 'credit' | 'debit') => handleTxnChange(index, 'type', v)}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="credit">Credit</SelectItem>
                                          <SelectItem value="debit">Debit</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-1">
                                  <Label>Category</Label>
                                  <Select value={txn.category} onValueChange={(v: Transaction['category']) => handleTxnChange(index, 'category', v)}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="UPI">UPI</SelectItem>
                                          <SelectItem value="IMPS">IMPS</SelectItem>
                                          <SelectItem value="Card Payment">Card Payment</SelectItem>
                                          <SelectItem value="Food">Food</SelectItem>
                                          <SelectItem value="Shopping">Shopping</SelectItem>
                                          <SelectItem value="Travel">Travel</SelectItem>
                                          <SelectItem value="Bills">Bills</SelectItem>
                                          <SelectItem value="Other">Other</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </SettingsSection>

          <SettingsSection title="Live Chat Messages" description="Manage the mock chat conversation.">
              <Button onClick={addChatMessage} className="mb-4">
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Message
              </Button>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {localData.chatMessages.map((msg, index) => (
                      <div key={msg.id} className="p-3 border rounded-lg space-y-3">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-sm">
                                <span className="text-muted-foreground">Sender:</span> {msg.sender}
                            </p>
                            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => removeChatMessage(msg.id)}>
                              <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1">
                                  <Label>Content</Label>
                                  <Textarea 
                                      value={msg.content} 
                                      onChange={e => handleChatMessageChange(index, 'content', e.target.value)}
                                      rows={3}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <Label>Sender</Label>
                                  <Select value={msg.sender} onValueChange={(v: 'user' | 'agent' | 'system') => handleChatMessageChange(index, 'sender', v)}>
                                      <SelectTrigger><SelectValue/></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="user">User</SelectItem>
                                          <SelectItem value="agent">Agent</SelectItem>
                                          <SelectItem value="system">System</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-1">
                                  <Label>Timestamp</Label>
                                  <Input type="text" value={msg.timestamp} onChange={e => handleChatMessageChange(index, 'timestamp', e.target.value)} />
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </SettingsSection>
          
          <SettingsSection title="Super Logout" description="Restart the app and repeat the welcome and existing-user verification flow before signing in with your MPIN.">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-destructive/10 p-2 text-destructive"><LogOut className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="font-semibold">Reset the login session</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your saved profile, account details, transactions, banners, and app settings will be kept. You will be signed out and guided through the Super Logout screens before returning to MPIN login.</p>
                </div>
              </div>
              <Button variant="destructive" className="w-full" onClick={async () => {
                try {
                  await setSuperLogoutPending();
                  window.sessionStorage.removeItem('finoPayAuth');
                  router.push('/super-logout');
                } catch {
                  toast({ variant: 'destructive', title: 'Could not start Super Logout', description: 'IndexedDB is unavailable. Please enable site storage and try again.' });
                }
              }}>
                <LogOut className="mr-2 h-4 w-4" /> Super Logout
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection title="Statement PDF Import" description="Extract statement transactions and account details locally in your browser. Review the result, then choose how to apply it.">
            <div className="space-y-3">
              <Label>PDF Statement</Label>
              <Input type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} disabled={isExtracting} />
              {isExtracting && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Reading statement pages and extracting rows...</div>}
              {parsedStatement && <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">Statement preview</h3>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">Name:</span> {parsedStatement.details.name || 'Not found'}</p>
                  <p><span className="text-muted-foreground">Customer ID:</span> {parsedStatement.details.customerId || 'Not found'}</p>
                  <p><span className="text-muted-foreground">Account number:</span> {parsedStatement.details.accountNumber || 'Not found'}</p>
                  <p><span className="text-muted-foreground">IFSC:</span> {parsedStatement.details.ifsc || 'Not found'}</p>
                  <p><span className="text-muted-foreground">Branch:</span> {parsedStatement.details.branchName || 'Not found'}</p>
                  <p><span className="text-muted-foreground">Closing balance:</span> {parsedStatement.details.closingBalance?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'Not found'}</p>
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {parsedStatement.details.address || 'Not found'}</p>
                  <p><span className="text-muted-foreground">Transactions found:</span> {parsedStatement.transactions.length}</p>
                  <p><span className="text-muted-foreground">Date range:</span> {parsedStatement.transactions.length ? `${new Date(Math.min(...parsedStatement.transactions.map(t => Date.parse(t.date)))).toLocaleDateString('en-IN')} ? ${new Date(Math.max(...parsedStatement.transactions.map(t => Date.parse(t.date)))).toLocaleDateString('en-IN')}` : 'N/A'}</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button onClick={() => applyParsedStatement('replace-app')}>Replace App Data</Button>
                  <Button variant="outline" onClick={() => applyParsedStatement('replace-transactions')}>Replace Transactions Only</Button>
                  <Button variant="outline" onClick={() => applyParsedStatement('save-transactions')}>Save Transactions (Keep Existing)</Button>
                </div>
                <p className="text-xs text-muted-foreground">Replace App Data updates the profile, primary account details, balance and transactions while preserving your app logo, banners, payees and chat history. The other two actions change transactions only.</p>
              </div>}
            </div>
          </SettingsSection>
        </div>

        <Dialog open={isJsonViewerOpen} onOpenChange={setIsJsonViewerOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <DialogTitle>View App Data (JSON)</DialogTitle>
                  <DialogDescription>
                    This is the live data currently used by the application.
                  </DialogDescription>
                </div>
                <Button variant="outline" onClick={copyJsonToClipboard} className="shrink-0">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy JSON
                </Button>
              </div>
            </DialogHeader>
            <div className="mt-4">
              <ScrollArea className="h-[50vh] w-full rounded-md border p-4">
                <pre>
                  <code>{JSON.stringify(localData, null, 2)}</code>
                </pre>
              </ScrollArea>
            </div>
            <DialogFooter className="mt-4">
                <DialogClose asChild>
                    <Button type="button">Close</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isExportLinkDialogOpen} onOpenChange={setIsExportLinkDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Export by Link</DialogTitle>
                  <DialogDescription>
                      This link contains a snapshot of your current app data. Anyone with the link can download the data.
                  </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex items-center space-x-2">
                  <Input 
                      value={exportLink} 
                      readOnly 
                      className="flex-1"
                  />
                  <Button type="button" size="icon" onClick={copyExportLink}>
                      <Copy className="h-4 w-4" />
                  </Button>
              </div>
              <DialogFooter className="mt-4">
                  <Button asChild variant="outline">
                    <a href={exportLink} target="_blank" rel="noopener noreferrer">Open Link</a>
                  </Button>
                  <DialogClose asChild>
                      <Button type="button">Close</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
}
