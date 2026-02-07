import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BiometricSummary, DailyBreakdown } from '@/hooks/useBiometricData';
import { msToTime, formatDateTime } from '@/lib/biometric-utils';
import { Clock, Target, Timer, AlertTriangle, CheckCircle, Coffee } from 'lucide-react';

interface BiometricSummaryCardProps {
  summary: BiometricSummary;
  dailyBreakdown: DailyBreakdown[];
  totalOutOfOfficeTime: number;
}

export function BiometricSummaryCard({ summary, dailyBreakdown, totalOutOfOfficeTime }: BiometricSummaryCardProps) {
  const outTimeLimitMs = 30 * 60 * 1000; // 30 minutes
  const isOutTimeExceeded = totalOutOfOfficeTime > outTimeLimitMs;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Summary Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">First In Time</p>
                <p className="text-lg font-semibold">
                  {summary.firstInTime ? formatDateTime(summary.firstInTime) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Timer className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total In Time (excl. Lunch)</p>
                <p className="text-lg font-semibold">{msToTime(summary.totalInTimeMs)}</p>
              </div>
            </div>

            {/* Total Out of Office Time - Synced with Transaction Table */}
            <div className={`flex items-center gap-3 p-4 rounded-lg ${isOutTimeExceeded ? 'bg-destructive/10 border border-destructive/30' : 'bg-warning/10 border border-warning/30'}`}>
              <Coffee className={`h-8 w-8 ${isOutTimeExceeded ? 'text-destructive' : 'text-warning'}`} />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Out of Office</p>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-semibold ${isOutTimeExceeded ? 'text-destructive' : 'text-warning'}`}>
                    {msToTime(totalOutOfOfficeTime)}
                  </p>
                  {isOutTimeExceeded ? (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Exceeded 30m!
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-success border-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Within Limit
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">8-Hour Target</p>
                <div className="flex items-center gap-2">
                  {summary.targetMet ? (
                    <Badge className="bg-success hover:bg-success/90">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Met
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Short by {msToTime(summary.shortBy)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Expected Out Time</p>
            <p className="text-xl font-bold text-primary">{summary.expectedOutTime}</p>
            {!summary.targetMet && (
              <p className="text-xs text-muted-foreground mt-1">(if working continuously)</p>
            )}
          </div>
        </CardContent>
      </Card>

      {dailyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyBreakdown.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted gap-2"
                >
                  <div>
                    <p className="font-medium">{day.date}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">In Time</p>
                      <p className="font-semibold text-success">{msToTime(day.inMs)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Out Time</p>
                      <p className={`font-semibold ${day.outTimeExceeded ? 'text-destructive' : 'text-warning'}`}>
                        {msToTime(day.outMs)}
                      </p>
                    </div>
                    {day.outTimeExceeded ? (
                      <Badge variant="destructive" className="ml-2">
                        &gt; 30m Limit!
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2 text-success border-success">
                        OK
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
