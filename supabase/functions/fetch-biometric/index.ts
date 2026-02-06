import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const soapUrl = 'http://122.176.104.29:73/WebAPIService.asmx';
const username = 'essl1';
const password = 'Essl@123';

// Machine Configuration
const machines = [
  { serial: 'NCD8244900721', name: 'Login Machine 1', type: 'In', location: '2212' },
  { serial: 'NCD8244900709', name: 'Logout Machine 1', type: 'Out', location: '2212' },
  { serial: 'NCD8244900719', name: 'Login Machine 2', type: 'In', location: '2215' },
  { serial: 'NCD8244900733', name: 'Logout Machine 2', type: 'Out', location: '2215' }
];

interface Transaction {
  employeeCode: string;
  punchTime: string;
  deviceSerial: string;
  deviceName: string;
  punchType: string;
  location: string;
}

interface MachineConfig {
  serial: string;
  name: string;
  type: string;
  location: string;
}

function parseESSLResponse(xmlString: string, machineConfig: MachineConfig): Transaction[] {
  const transactions: Transaction[] = [];

  const dataMatch = xmlString.match(/<strDataList>([\s\S]*?)<\/strDataList>/);
  if (!dataMatch) {
    return transactions;
  }

  const rawData = dataMatch[1].trim();
  if (!rawData || rawData === 'string') {
    return transactions;
  }

  const lines = rawData.split(/[\r\n]+/).filter(line => line.trim());

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const employeeCode = parts[0]?.trim();
      let punchTime = parts[1]?.trim();

      if (employeeCode && punchTime) {
        punchTime = punchTime.replace(' ', 'T');

        transactions.push({
          employeeCode,
          punchTime,
          deviceSerial: machineConfig.serial,
          deviceName: machineConfig.name,
          punchType: machineConfig.type,
          location: machineConfig.location
        });
      }
    }
  }

  return transactions;
}

async function fetchLogs(fromDate: string, toDate: string, machine: MachineConfig): Promise<string | null> {
  const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTransactionsLog xmlns="http://tempuri.org/">
      <FromDateTime>${fromDate} 00:01</FromDateTime>
      <ToDateTime>${toDate} 23:59</ToDateTime>
      <SerialNumber>${machine.serial}</SerialNumber>
      <UserName>${username}</UserName>
      <UserPassword>${password}</UserPassword>
      <strDataList>string</strDataList>
    </GetTransactionsLog>
  </soap:Body>
</soap:Envelope>`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/GetTransactionsLog'
      },
      body: soapRequest,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Error fetching from ${machine.name}: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Network Error fetching from ${machine.name}:`, error);
    return null;
  }
}

function calculateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): number {
  const maxStart = start1 > start2 ? start1 : start2;
  const minEnd = end1 < end2 ? end1 : end2;
  const diff = minEnd.getTime() - maxStart.getTime();
  return diff > 0 ? diff : 0;
}

interface DayStats {
  inMs: number;
  outMs: number;
}

interface Summary {
  totalInTimeMs: number;
  totalOutTimeMs: number;
  firstInTime: string | null;
  days: Record<string, DayStats>;
}

function processTransactions(transactions: Transaction[]): Summary {
  const sorted = [...transactions].sort((a, b) => 
    new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime()
  );

  const byDate: Record<string, Transaction[]> = {};
  sorted.forEach(t => {
    const dateStr = t.punchTime.split('T')[0];
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(t);
  });

  const summary: Summary = {
    totalInTimeMs: 0,
    totalOutTimeMs: 0,
    firstInTime: null,
    days: {}
  };

  if (sorted.length > 0) {
    const firstIn = sorted.find(t => t.punchType === 'In');
    if (firstIn) {
      summary.firstInTime = firstIn.punchTime;
    }
  }

  Object.keys(byDate).forEach(dateStr => {
    const dayPunches = byDate[dateStr];
    
    const refDate = new Date(dayPunches[0].punchTime);
    const lunchStart = new Date(refDate);
    lunchStart.setHours(13, 30, 0, 0);
    const lunchEnd = new Date(refDate);
    lunchEnd.setHours(14, 0, 0, 0);

    let dayInMs = 0;
    let dayOutMs = 0;
    let inTime: Date | null = null;
    let lastOutTime: Date | null = null;
    let isInside = false;

    for (const punch of dayPunches) {
      const pDate = new Date(punch.punchTime);

      if (punch.punchType === 'In') {
        if (!isInside) {
          inTime = pDate;
          isInside = true;

          if (lastOutTime) {
            const gapDuration = pDate.getTime() - lastOutTime.getTime();
            const overlap = calculateOverlap(lastOutTime, pDate, lunchStart, lunchEnd);
            const effectiveGap = gapDuration - overlap;
            if (effectiveGap > 0) dayOutMs += effectiveGap;
          }
        }
      } else if (punch.punchType === 'Out') {
        if (isInside && inTime) {
          const duration = pDate.getTime() - inTime.getTime();
          const overlap = calculateOverlap(inTime, pDate, lunchStart, lunchEnd);
          const effectiveWork = duration - overlap;
          if (effectiveWork > 0) dayInMs += effectiveWork;

          isInside = false;
          lastOutTime = pDate;
        }
      }
    }

    if (isInside && inTime) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dateStr === todayStr) {
        const now = new Date();
        const duration = now.getTime() - inTime.getTime();
        const overlap = calculateOverlap(inTime, now, lunchStart, lunchEnd);
        const effectiveWork = duration - overlap;
        if (effectiveWork > 0) {
          dayInMs += effectiveWork;
        }
      }
    }

    summary.totalInTimeMs += dayInMs;
    summary.totalOutTimeMs += dayOutMs;

    summary.days[dateStr] = {
      inMs: dayInMs,
      outMs: dayOutMs
    };
  });

  return summary;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employeeId, fromDate, toDate } = await req.json();

    if (!employeeId || !fromDate || !toDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: employeeId, fromDate, toDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching logs for employee ${employeeId} from ${fromDate} to ${toDate}`);

    const fetchPromises = machines.map(async (machine) => {
      const xmlResponse = await fetchLogs(fromDate, toDate, machine);
      if (xmlResponse) {
        return parseESSLResponse(xmlResponse, machine);
      }
      return [];
    });

    const results = await Promise.all(fetchPromises);
    const allTransactions = results.flat();

    const userTransactions = allTransactions.filter(t => t.employeeCode === employeeId);
    userTransactions.sort((a, b) => 
      new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime()
    );

    const summary = processTransactions(userTransactions);

    const eightHoursMs = 8 * 60 * 60 * 1000;
    const thirtyMinsMs = 30 * 60 * 1000;
    const inDiff = summary.totalInTimeMs - eightHoursMs;

    let expectedOutTime: string | null = null;
    if (inDiff < 0) {
      const now = new Date();
      const expectedOut = new Date(now.getTime() + Math.abs(inDiff));
      expectedOutTime = expectedOut.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
      });
    }

    const dailyBreakdown = Object.entries(summary.days).map(([date, stats]) => ({
      date,
      inMs: stats.inMs,
      outMs: stats.outMs,
      outTimeExceeded: stats.outMs > thirtyMinsMs
    }));

    return new Response(
      JSON.stringify({
        success: true,
        transactions: userTransactions,
        summary: {
          firstInTime: summary.firstInTime,
          totalInTimeMs: summary.totalInTimeMs,
          totalOutTimeMs: summary.totalOutTimeMs,
          targetMet: inDiff >= 0,
          shortBy: inDiff < 0 ? Math.abs(inDiff) : 0,
          expectedOutTime: inDiff < 0 ? expectedOutTime : 'Goal Reached!'
        },
        dailyBreakdown
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
