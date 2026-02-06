import { BiometricSearchForm } from '@/components/BiometricSearchForm';
import { TransactionTable } from '@/components/TransactionTable';
import { BiometricSummaryCard } from '@/components/BiometricSummaryCard';
import { useBiometricData } from '@/hooks/useBiometricData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Index = () => {
  const { data, loading, error, fetchData } = useBiometricData();

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
            />
            <TransactionTable transactions={data.transactions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
