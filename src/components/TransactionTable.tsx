import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction } from '@/hooks/useBiometricData';
import { formatDateTime, msToTime } from '@/lib/biometric-utils';
import { LogIn, LogOut, Clock, Coffee } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionTableProps {
  transactions: Transaction[];
  totalOutOfOfficeTime: number;
}

interface ProcessedTransaction extends Transaction {
  breakDuration?: number;
  runningOutTotal?: number;
}

interface DisplayRow {
  type: 'transaction' | 'out-of-office';
  transaction?: ProcessedTransaction;
  outOfOffice?: {
    startTime: string;
    endTime: string;
    duration: number;
  };
}

function processTransactionsWithBreaks(transactions: Transaction[]): { processed: ProcessedTransaction[], displayRows: DisplayRow[] } {
  const processed: ProcessedTransaction[] = [];
  const displayRows: DisplayRow[] = [];
  let runningOutTotal = 0;

  for (let i = 0; i < transactions.length; i++) {
    const current = transactions[i];
    const next = transactions[i + 1];

    let breakDuration: number | undefined;

    if (current.punchType === 'Out' && next && next.punchType === 'In') {
      const outTime = new Date(current.punchTime).getTime();
      const inTime = new Date(next.punchTime).getTime();
      breakDuration = inTime - outTime;
      
      if (breakDuration > 0) {
        runningOutTotal += breakDuration;
      }
    }

    const processedTransaction: ProcessedTransaction = {
      ...current,
      breakDuration: breakDuration && breakDuration > 0 ? breakDuration : undefined,
      runningOutTotal: current.punchType === 'Out' && breakDuration && breakDuration > 0 ? runningOutTotal : undefined
    };

    processed.push(processedTransaction);
    displayRows.push({ type: 'transaction', transaction: processedTransaction });

    // Add out-of-office row after OUT punch if there's a following IN
    if (breakDuration && breakDuration > 0) {
      displayRows.push({
        type: 'out-of-office',
        outOfOffice: {
          startTime: current.punchTime,
          endTime: next.punchTime,
          duration: breakDuration
        }
      });
    }
  }

  return { processed, displayRows };
}

function formatTime(dateTimeStr: string): string {
  try {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateTimeStr;
  }
}

// Mobile Card View
function MobileTransactionCard({ row, index }: { row: DisplayRow; index: number }) {
  if (row.type === 'out-of-office' && row.outOfOffice) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mx-2">
        <div className="flex items-center gap-2 text-warning">
          <Coffee className="h-4 w-4" />
          <span className="font-medium text-sm">Out of Office</span>
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {formatTime(row.outOfOffice.startTime)} → {formatTime(row.outOfOffice.endTime)}
        </div>
        <Badge variant="outline" className="mt-2 text-warning border-warning">
          {msToTime(row.outOfOffice.duration)}
        </Badge>
      </div>
    );
  }

  if (row.type === 'transaction' && row.transaction) {
    const t = row.transaction;
    return (
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{formatDateTime(t.punchTime)}</span>
          {t.punchType === 'In' ? (
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
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{t.location}</Badge>
          <span className="text-muted-foreground">{t.deviceName}</span>
        </div>

        {(t.breakDuration || t.runningOutTotal) && (
          <div className="flex gap-3 pt-2 border-t">
            {t.breakDuration && (
              <div className="text-xs">
                <span className="text-muted-foreground">Break: </span>
                <span className="text-warning font-medium">{msToTime(t.breakDuration)}</span>
              </div>
            )}
            {t.runningOutTotal && (
              <div className="text-xs">
                <span className="text-muted-foreground">Total: </span>
                <Badge variant="outline" className="text-warning border-warning text-xs">
                  {msToTime(t.runningOutTotal)}
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function TransactionTable({ transactions, totalOutOfOfficeTime }: TransactionTableProps) {
  const isMobile = useIsMobile();

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

  const { displayRows } = processTransactionsWithBreaks(transactions);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Attendance Records
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{transactions.length} records</Badge>
            {totalOutOfOfficeTime > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 text-warning border-warning">
                <Coffee className="h-3 w-3" />
                Total Out: {msToTime(totalOutOfOfficeTime)}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <div className="space-y-3">
            {displayRows.map((row, index) => (
              <MobileTransactionCard key={index} row={row} index={index} />
            ))}
          </div>
        ) : (
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
                {displayRows.map((row, index) => {
                  if (row.type === 'out-of-office' && row.outOfOffice) {
                    return (
                      <TableRow key={`out-${index}`} className="bg-warning/5 hover:bg-warning/10">
                        <TableCell colSpan={6}>
                          <div className="flex items-center gap-3 py-1">
                            <Coffee className="h-4 w-4 text-warning" />
                            <span className="text-warning font-medium">Out of Office:</span>
                            <span className="text-muted-foreground">
                              {formatTime(row.outOfOffice.startTime)} → {formatTime(row.outOfOffice.endTime)}
                            </span>
                            <Badge variant="outline" className="text-warning border-warning ml-auto">
                              {msToTime(row.outOfOffice.duration)}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  if (row.type === 'transaction' && row.transaction) {
                    const t = row.transaction;
                    return (
                      <TableRow key={`${t.punchTime}-${index}`}>
                        <TableCell className="font-medium">
                          {formatDateTime(t.punchTime)}
                        </TableCell>
                        <TableCell>
                          {t.punchType === 'In' ? (
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
                          {t.breakDuration ? (
                            <span className="text-warning font-medium">
                              {msToTime(t.breakDuration)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {t.runningOutTotal ? (
                            <Badge variant="outline" className="text-warning border-warning">
                              {msToTime(t.runningOutTotal)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{t.deviceName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.location}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return null;
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
