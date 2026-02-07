import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BiometricSearchFormProps {
  onSearch: (employeeId: string, fromDate: string, toDate: string) => void;
  loading: boolean;
}

export function BiometricSearchForm({ onSearch, loading }: BiometricSearchFormProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) return;

    const fromDateStr = format(fromDate, 'yyyy-MM-dd');
    const toDateStr = format(toDate, 'yyyy-MM-dd');
    onSearch(employeeId.trim(), fromDateStr, toDateStr);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          Biometric Attendance Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee / Biometric ID</Label>
            <Input
              id="employeeId"
              placeholder="Enter your Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : <span>Pick from date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={(date) => date && setFromDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : <span>Pick to date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={(date) => date && setToDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full text-lg py-6" 
            disabled={loading || !employeeId.trim()}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Fetching Data...
              </>
            ) : (
              <>
                <span className="mr-2">📊</span>
                Get Attendance Data
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
