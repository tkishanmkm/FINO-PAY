'use client';

import { useState, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import type { Transaction } from '@/lib/types';
import { Download, Loader2 } from 'lucide-react';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isValid, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSearchParams } from 'next/navigation';
import type { DateRange } from 'react-day-picker';

// Date range types
type DateRangeOption = 'last_7_days' | 'last_3_months' | 'current_month' | 'last_month' | 'all' | 'custom';

// Format helper to handle IST formatting
const formatInIST = (dateString: string, formatString: string) => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) throw new Error('Invalid date');
    return formatInTimeZone(date, 'Asia/Kolkata', formatString);
  } catch (e) {
    return dateString;
  }
};

export default function PassbookPage() {
  const { appData } = useAppData();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const durationFromParams = searchParams.get('duration') as DateRangeOption | null;

  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>(durationFromParams || 'last_3_months');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (durationFromParams) {
      setDateRangeOption(durationFromParams);
    }
  }, [durationFromParams]);

  const filterTransactions = (transactions: Transaction[]): Transaction[] => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateRangeOption) {
      case 'last_7_days': startDate = subDays(now, 7); endDate = now; break;
      case 'last_3_months': startDate = subMonths(now, 3); endDate = now; break;
      case 'current_month': startDate = startOfMonth(now); endDate = now; break;
      case 'last_month': startDate = startOfMonth(subMonths(now, 1)); endDate = endOfMonth(subMonths(now, 1)); break;
      case 'custom': startDate = customDateRange?.from || null; endDate = customDateRange?.to ? new Date(customDateRange.to.setHours(23, 59, 59, 999)) : null; break;
      case 'all': default: return transactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }

    const sorted = transactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    if (!startDate && !endDate) return sorted;
    return sorted.filter(t => {
      const txnDate = parseISO(t.date);
      if (!isValid(txnDate)) return false;
      return (!startDate || txnDate >= startDate) && (!endDate || txnDate <= endDate);
    });
  };

  const filteredTransactions = filterTransactions(appData.transactions);

  const getStatementDateRange = () => {
    const now = new Date();
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    switch (dateRangeOption) {
        case 'last_7_days':
            fromDate = subDays(now, 7);
            toDate = now;
            break;
        case 'last_3_months':
            fromDate = subMonths(now, 3);
            toDate = now;
            break;
        case 'current_month':
            fromDate = startOfMonth(now);
            toDate = now;
            break;
        case 'last_month':
            fromDate = startOfMonth(subMonths(now, 1));
            toDate = endOfMonth(subMonths(now, 1));
            break;
        case 'custom':
            fromDate = customDateRange?.from;
            toDate = customDateRange?.to;
            break;
        case 'all':
            if (filteredTransactions.length > 0) {
                const sortedTxns = [...filteredTransactions].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
                fromDate = parseISO(sortedTxns[0].date);
                toDate = parseISO(sortedTxns[sortedTxns.length - 1].date);
            } else {
                fromDate = new Date();
                toDate = new Date();
            }
            break;
        default:
            fromDate = now;
            toDate = now;
            break;
    }

    return {
        from: fromDate ? format(fromDate, 'dd/MM/yyyy') : 'N/A',
        to: toDate ? format(toDate, 'dd/MM/yyyy') : 'N/A',
    };
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    toast({
        title: "Generating PDF...",
        description: "Your statement is being prepared."
    });

    try {
        const { user, accounts, appSettings } = appData;
        const mainAccount = accounts.find(acc => acc.type === 'Savings' || acc.type === 'Sampann current');
        if (!mainAccount) throw new Error("Main account not found");
        
        const doc = new jsPDF('p', 'pt', 'a4');
        const FONT = 'Helvetica';
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        let finalY = 0;
        
        const headerBannerImg = appSettings.statementHeaderBanner ? new Image() : null;
        if(headerBannerImg && appSettings.statementHeaderBanner) {
            headerBannerImg.src = appSettings.statementHeaderBanner;
            await new Promise(resolve => {
                headerBannerImg.onload = () => resolve(true);
                headerBannerImg.onerror = () => resolve(false);
            });
        }
        
        const addHeader = (docInstance: jsPDF) => {
             if(headerBannerImg?.complete && headerBannerImg.src.startsWith('data')) {
                docInstance.addImage(headerBannerImg, 'PNG', 40, 30, 150, 38, undefined, 'FAST');
             } else {
                docInstance.setFont(FONT, 'bold');
                docInstance.setFontSize(20);
                docInstance.setTextColor(0, 0, 0);
                docInstance.text("Fino Payments Bank", 40, 40);
             }
        }
        
        // Add header to first page
        addHeader(doc);
        
        // --- STATEMENT TITLE ---
        doc.setFont(FONT, 'bold');
        doc.setFontSize(16);
        doc.setTextColor(58, 58, 177); // Header Color
        doc.text("Statement of Account", pageWidth / 2, 90, { align: 'center' });
        doc.setLineWidth(1.5);
        doc.setDrawColor(58, 58, 177); // Header Color
        doc.line(pageWidth / 2 - 70, 95, pageWidth / 2 + 70, 95);
        
        finalY = 120;

        // --- USER & ACCOUNT DETAILS (NO TABLE) ---
        doc.setFont(FONT, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0); // Reset text color
        doc.text(`Name: ${user.name}`, 40, finalY);
        doc.text(`Branch Address: ${mainAccount.branchName || 'N/A'}`, pageWidth / 2, finalY);
        finalY += 15;
        doc.text(`Address: ${user.contact.address || '-'}`, 40, finalY);
        doc.text(`IFSC: ${mainAccount.ifsc || 'N/A'}`, pageWidth / 2, finalY);
        finalY += 20;

        // --- ACCOUNT DETAILS TABLE ---
        autoTable(doc, {
            startY: finalY,
            head: [['Customer ID', 'A/c No', 'A/c Type', 'Variant', 'Nominee']],
            body: [[user.customerId, mainAccount.accountNumber, mainAccount.type, 'Sampann Current Account', mainAccount.nominee || 'Registered']],
            headStyles: { fillColor: [58, 58, 177], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fontStyle: 'bold', textColor: [0, 0, 0], font: FONT, halign: 'center' },
            styles: { fontSize: 9, cellPadding: 5, font: FONT, lineColor: [0, 0, 0], lineWidth: 1.0 },
            theme: 'grid'
        });
        finalY = (doc as any).lastAutoTable.finalY + 20;

        // --- PROMO BANNER ---
        if(appSettings.statementMiddleBanner) {
            const bannerImg = new Image();
            bannerImg.src = appSettings.statementMiddleBanner;
            await new Promise(resolve => {
                bannerImg.onload = () => {
                    const bannerWidth = pageWidth - 80; // Margin 40 on each side
                    const bannerHeight = bannerWidth * (bannerImg.height / bannerImg.width);
                    if (finalY + bannerHeight < pageHeight - 40) { // Check if it fits on current page
                        doc.addImage(bannerImg, 'PNG', 40, finalY, bannerWidth, bannerHeight, undefined, 'FAST');
                        finalY += bannerHeight + 20;
                    }
                    resolve(true);
                }
                bannerImg.onerror = () => {
                    finalY += 20;
                    resolve(true);
                }
            });
        }
        
        // --- TRANSACTION PERIOD ROW ---
        const dateRange = getStatementDateRange();
        autoTable(doc, {
            startY: finalY,
            body: [[`Transaction Details for the period ${dateRange.from} to ${dateRange.to}`]],
            theme: 'plain',
            styles: {
                halign: 'center',
                fontStyle: 'normal',
                fillColor: '#FFFFFF',
                textColor: [0, 0, 255],
                fontSize: 10,
                cellPadding: 8,
                font: FONT
            }
        });
        finalY = (doc as any).lastAutoTable.finalY;

        // --- TRANSACTIONS TABLE ---
        const sortedTransactions = [...filteredTransactions].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
        
        const formatCurrency = (amount: number) => {
            return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        const body = sortedTransactions.map(txn => [
            formatInIST(txn.date, 'dd-MM-yyyy'),
            txn.id,
            txn.description,
            txn.type === 'debit' ? formatCurrency(txn.amount) : '-',
            txn.type === 'credit' ? formatCurrency(txn.amount) : '-',
            formatCurrency(txn.balanceAfter)
        ]);

        const firstPageBody = body.slice(0, 10);
        const remainingBody = body.slice(10);
        
        autoTable(doc, {
            startY: finalY,
            head: [['Txn Date', 'Reference No.', 'Description', 'Debits', 'Credits', 'Balance(in Rs.)']],
            body: firstPageBody,
            headStyles: { fillColor: [58, 58, 177], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 10, lineColor: [0, 0, 0], lineWidth: 1.0 },
            bodyStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
            styles: { fontSize: 8, font: FONT, cellPadding: 5, lineColor: [0, 0, 0], lineWidth: 1.0, valign: 'middle' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 60 },
                1: { halign: 'left', cellWidth: 100 },
                2: { halign: 'left', cellWidth: 'auto' },
                3: { halign: 'center', cellWidth: 80 },
                4: { halign: 'center', cellWidth: 80 },
                5: { halign: 'center', cellWidth: 90 },
            },
            theme: 'grid'
        });
        
        if (remainingBody.length > 0) {
            autoTable(doc, {
                head: [['Txn Date', 'Reference No.', 'Description', 'Debits', 'Credits', 'Balance(in Rs.)']],
                body: remainingBody,
                margin: { top: 90 }, // Global top margin for all pages
                headStyles: { fillColor: [58, 58, 177], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 10, lineColor: [0, 0, 0], lineWidth: 1.0 },
                bodyStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
                styles: { fontSize: 8, font: FONT, cellPadding: 5, lineColor: [0, 0, 0], lineWidth: 1.0, valign: 'middle' },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 60 },
                    1: { halign: 'left', cellWidth: 100 },
                    2: { halign: 'left', cellWidth: 'auto' },
                    3: { halign: 'center', cellWidth: 80 },
                    4: { halign: 'center', cellWidth: 80 },
                    5: { halign: 'center', cellWidth: 90 },
                },
                theme: 'grid',
                didDrawPage: (data) => {
                    addHeader(doc);
                }
            });
        }


        doc.save(`fino-pay-statement-${new Date().toISOString().split('T')[0]}.pdf`);
        
        toast({
            title: "Download Complete",
            description: "Your PDF statement has been downloaded."
        });

    } catch (error) {
        console.error("Failed to generate PDF", error);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "There was an error generating your PDF statement."
        });
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">All Transactions</h1>
        <Button variant="ghost" size="icon" className="text-primary" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? <Loader2 className="h-6 w-6 animate-spin text-blue-500" /> : <Download className="h-6 w-6 text-blue-500" />}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select onValueChange={(value: DateRangeOption) => setDateRangeOption(value)} value={dateRangeOption}>
          <SelectTrigger className="w-fit bg-primary text-primary-foreground border-0 rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary/90 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7_days">Last 7 days</SelectItem>
            <SelectItem value="last_3_months">Last 3 months</SelectItem>
            <SelectItem value="current_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {dateRangeOption === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant="outline" className={cn("w-fit justify-start text-left font-normal", !customDateRange && "text-muted-foreground")}> 
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customDateRange?.from ? (
                  customDateRange.to ? (
                    <>
                      {format(customDateRange.from, "LLL dd, y")} - {format(customDateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(customDateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={customDateRange?.from}
                selected={customDateRange}
                onSelect={setCustomDateRange}
                numberOfMonths={2}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="bg-background rounded-lg">
        {filteredTransactions.map((txn, index) => (
          <div key={txn.id}>
            <div className="py-4 px-2">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-sm">{formatInIST(txn.date, 'dd/MM/yyyy HH:mm:ss')}</p>
                <div className="flex items-center gap-1 whitespace-nowrap ml-4">
                  <p className={cn("font-bold text-base", txn.type === 'credit' ? 'text-green-600' : 'text-red-600')}>
                    ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 break-words pr-4">{txn.description}</p>
            </div>
            {index < filteredTransactions.length - 1 && <Separator />}
          </div>
        ))}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No transactions found for the selected period.
          </div>
        )}
      </div>
    </div>
  );
}

    