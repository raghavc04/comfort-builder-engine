import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Transaction {
  employeeCode: string;
  punchTime: string;
  deviceSerial: string;
  deviceName: string;
  punchType: 'In' | 'Out';
  location: string;
}

export interface DailyBreakdown {
  date: string;
  inMs: number;
  outMs: number;
  outTimeExceeded: boolean;
}

export interface BiometricSummary {
  firstInTime: string | null;
  totalInTimeMs: number;
  totalOutTimeMs: number;
  targetMet: boolean;
  shortBy: number;
  expectedOutTime: string;
}

export interface BiometricData {
  transactions: Transaction[];
  summary: BiometricSummary;
  dailyBreakdown: DailyBreakdown[];
}

export function useBiometricData() {
  const [data, setData] = useState<BiometricData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (employeeId: string, fromDate: string, toDate: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke(
        'fetch-biometric',
        {
          body: { employeeId, fromDate, toDate }
        }
      );

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch data');
      }

      setData({
        transactions: responseData.transactions,
        summary: responseData.summary,
        dailyBreakdown: responseData.dailyBreakdown
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchData };
}
