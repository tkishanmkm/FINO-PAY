import React from 'react';
import type { User, Account, Transaction, AppSettings } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface StatementTemplateProps {
  user: User;
  account: Account;
  transactions: Transaction[];
  appSettings: AppSettings;
  dateRange: { from: string; to: string };
}

// Using inline styles for simplicity as Tailwind classes won't be processed here
const styles: { [key: string]: React.CSSProperties } = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#333',
    backgroundColor: '#fff',
    padding: '40px',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    width: '50px',
    height: '50px',
    marginRight: '10px',
  },
  bankName: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  statementTitle: {
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    textDecoration: 'underline',
    textDecorationColor: '#4A90E2',
    textUnderlineOffset: '4px',
    color: '#242A56',
    margin: '20px 0',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0 40px',
    marginBottom: '20px',
  },
  detailItem: {
    display: 'flex',
    marginBottom: '8px'
  },
  detailLabel: {
    fontWeight: 'bold',
    width: '120px',
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
    marginTop: '10px',
  },
  th: {
    backgroundColor: '#242A56',
    color: '#fff',
    padding: '8px',
    textAlign: 'left',
    border: '1px solid #ddd',
  },
  td: {
    padding: '8px',
    border: '1px solid #ddd',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  textRight: {
    textAlign: 'right',
  },
  banner: {
    width: '100%',
    height: 'auto',
    margin: '20px 0',
    display: 'block',
  },
  periodTitle: {
      textAlign: 'center',
      fontWeight: 'bold',
      color: '#4A90E2',
      margin: '20px 0'
  }
};

const StatementTemplate: React.FC<StatementTemplateProps> = ({ user, account, transactions, appSettings, dateRange }) => {
  
  const formatTxnDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd-MM-yyyy');
    } catch {
      return dateString;
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  
  let runningBalance: number | null = null;
  if (sortedTransactions.length > 0) {
      const firstTxn = sortedTransactions[0];
      runningBalance = firstTxn.type === 'credit' 
          ? firstTxn.balanceAfter - firstTxn.amount 
          : firstTxn.balanceAfter + firstTxn.amount;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>Statement of Account</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
          body { font-family: 'Roboto', sans-serif; }
          * { box-sizing: border-box; }
        `}</style>
      </head>
      <body style={styles.body}>
        <header style={styles.header}>
          <div style={styles.logoContainer}>
            {appSettings.appLogo && <img src={appSettings.appLogo} alt="Fino Bank" style={styles.logo} />}
            <span style={styles.bankName}>Fino Payments Bank</span>
          </div>
        </header>

        <h1 style={styles.statementTitle}>Statement of Account</h1>

        <div style={styles.detailsGrid}>
            <div style={styles.detailItem}><span style={styles.detailLabel}>Name:</span> <span style={styles.detailValue}>{user.name}</span></div>
            <div style={styles.detailItem}><span style={styles.detailLabel}>Branch Address:</span> <span style={styles.detailValue}>{account.branchName || 'N/A'}</span></div>
            <div style={styles.detailItem}><span style={styles.detailLabel}>Address:</span> <span style={styles.detailValue}>-</span></div>
            <div style={styles.detailItem}><span style={styles.detailLabel}>IFSC:</span> <span style={styles.detailValue}>{account.ifsc || 'N/A'}</span></div>
        </div>

        <table style={styles.table}>
            <thead>
                <tr>
                    <th style={styles.th}>Customer ID</th>
                    <th style={styles.th}>A/c No</th>
                    <th style={styles.th}>A/c Type</th>
                    <th style={styles.th}>A/c Variant</th>
                    <th style={styles.th}>Nominee</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={styles.td}>{user.customerId}</td>
                    <td style={styles.td}>{account.accountNumber}</td>
                    <td style={styles.td}>{account.type}</td>
                    <td style={styles.td}>Sampann Current Account</td>
                    <td style={styles.td}>{account.nominee || 'Registered'}</td>
                </tr>
            </tbody>
        </table>

        {appSettings.dashboardBanner && <img src={appSettings.dashboardBanner} alt="Promo Banner" style={styles.banner} />}

        <h2 style={styles.periodTitle}>
            Transaction Details for the period {dateRange.from} to {dateRange.to}
        </h2>

        <table style={styles.table}>
            <thead>
                <tr>
                    <th style={styles.th}>Txn Date</th>
                    <th style={{...styles.th, width: '15%'}}>Reference No.</th>
                    <th style={{...styles.th, width: '35%'}}>Description</th>
                    <th style={{...styles.th, ...styles.textRight}}>Debits</th>
                    <th style={{...styles.th, ...styles.textRight}}>Credits</th>
                    <th style={{...styles.th, ...styles.textRight}}>Balance(in Rs.)</th>
                </tr>
            </thead>
            <tbody>
                {runningBalance !== null && (
                    <tr>
                        <td style={styles.td} colSpan={5}><strong>Opening Balance</strong></td>
                        <td style={{...styles.td, ...styles.textRight}}><strong>{runningBalance.toFixed(2)}</strong></td>
                    </tr>
                )}
                {sortedTransactions.map(txn => {
                  if(runningBalance !== null){
                    runningBalance += (txn.type === 'credit' ? txn.amount : -txn.amount);
                  }
                  return (
                    <tr key={txn.id}>
                        <td style={styles.td}>{formatTxnDate(txn.date)}</td>
                        <td style={styles.td}>{txn.id}</td>
                        <td style={styles.td}>{txn.description}</td>
                        <td style={{...styles.td, ...styles.textRight}}>{txn.type === 'debit' ? txn.amount.toFixed(2) : '-'}</td>
                        <td style={{...styles.td, ...styles.textRight}}>{txn.type === 'credit' ? txn.amount.toFixed(2) : '-'}</td>
                        <td style={{...styles.td, ...styles.textRight}}>{runningBalance !== null ? runningBalance.toFixed(2) : txn.balanceAfter.toFixed(2)}</td>
                    </tr>
                  )
                })}
                 {transactions.length === 0 && (
                    <tr>
                        <td colSpan={6} style={{...styles.td, textAlign: 'center'}}>No transactions for this period.</td>
                    </tr>
                 )}
            </tbody>
        </table>

      </body>
    </html>
  );
};

export default StatementTemplate;
