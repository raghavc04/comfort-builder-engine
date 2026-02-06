import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction } from '@/hooks/useBiometricData';
import { formatDateTime } from '@/lib/biometric-utils';
import { LogIn, LogOut } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Attendance Records
          </span>
          <Badge variant="secondary">{transactions.length} records</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Device Name</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
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
