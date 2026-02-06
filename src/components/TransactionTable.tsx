import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction } from '@/hooks/useBiometricData';
import { formatDateTime, msToTime } from '@/lib/biometric-utils';
import { LogIn, LogOut, Clock } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
}

interface ProcessedTransaction extends Transaction {
  breakDuration?: number; // ms of break after this OUT punch
  runningOutTotal?: number; // cumulative out time up to this point
}

function processTransactionsWithBreaks(transactions: Transaction[]): ProcessedTransaction[] {
  const processed: ProcessedTransaction[] = [];
  let runningOutTotal = 0;

  for (let i = 0; i < transactions.length; i++) {
    const current = transactions[i];
    const next = transactions[i + 1];

    let breakDuration: number | undefined;

    // If current is OUT and next is IN, calculate break duration
    if (current.punchType === 'Out' && next && next.punchType === 'In') {
      const outTime = new Date(current.punchTime).getTime();
      const inTime = new Date(next.punchTime).getTime();
      breakDuration = inTime - outTime;
      
      // Only count positive breaks
      if (breakDuration > 0) {
        runningOutTotal += breakDuration;
      }
    }

    processed.push({
      ...current,
      breakDuration: breakDuration && breakDuration > 0 ? breakDuration : undefined,
      runningOutTotal: current.punchType === 'Out' && breakDuration && breakDuration > 0 ? runningOutTotal : undefined
    });
  }

  return processed;
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-lg">No records found for the selected criteria.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const processedTransactions = processTransactionsWithBreaks(transactions);
  const totalOutTime = processedTransactions.reduce((acc, t) => acc + (t.breakDuration || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Attendance Records
          </span>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{transactions.length} records</Badge>
            {totalOutTime > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Total Break: {msToTime(totalOutTime)}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Break Duration</TableHead>
                <TableHead>Running Total</TableHead>
                <TableHead>Device Name</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedTransactions.map((transaction, index) => (
                <TableRow key={`${transaction.punchTime}-${index}`}>
                  <TableCell className="font-medium">
                    {formatDateTime(transaction.punchTime)}
                  </TableCell>
                  <TableCell>
                    {transaction.punchType === 'In' ? (
                      <Badge className="bg-success hover:bg-success/90">
                        <LogIn className="h-3 w-3 mr-1" />
                        IN
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <LogOut className="h-3 w-3 mr-1" />
                        OUT
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.breakDuration ? (
                      <span className="text-warning font-medium">
                        {msToTime(transaction.breakDuration)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.runningOutTotal ? (
                      <Badge variant="outline" className="text-warning border-warning">
                        {msToTime(transaction.runningOutTotal)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{transaction.deviceName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.location}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
