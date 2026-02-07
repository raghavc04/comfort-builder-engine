import { BiometricSearchForm } from '@/components/BiometricSearchForm';
import { TransactionTable } from '@/components/TransactionTable';
import { BiometricSummaryCard } from '@/components/BiometricSummaryCard';
import { useBiometricData, Transaction } from '@/hooks/useBiometricData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

// Calculate total out-of-office time from transactions
function calculateTotalOutTime(transactions: Transaction[]): number {
  let total = 0;
  for (let i = 0; i < transactions.length; i++) {
    const current = transactions[i];
    const next = transactions[i + 1];
    
    if (current.punchType === 'Out' && next && next.punchType === 'In') {
      const outTime = new Date(current.punchTime).getTime();
      const inTime = new Date(next.punchTime).getTime();
      const duration = inTime - outTime;
      if (duration > 0) {
        total += duration;
      }
    }
  }
  return total;
}

const Index = () => {
  const { data, loading, error, fetchData } = useBiometricData();

  const totalOutOfOfficeTime = useMemo(() => {
    if (!data?.transactions) return 0;
    return calculateTotalOutTime(data.transactions);
  }, [data?.transactions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            🏢 Biometric Attendance System
          </h1>
          <p className="text-muted-foreground">
            Track your attendance, check work hours, and view punch records
          </p>
        </div>

        <BiometricSearchForm onSearch={fetchData} loading={loading} />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BiometricSummaryCard 
              summary={data.summary} 
              dailyBreakdown={data.dailyBreakdown}
              totalOutOfOfficeTime={totalOutOfOfficeTime}
            />
            <TransactionTable 
              transactions={data.transactions}
              totalOutOfOfficeTime={totalOutOfOfficeTime}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
