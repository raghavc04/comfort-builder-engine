export function msToTime(duration: number): string {
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  
  const hoursStr = hours < 10 ? "0" + hours : String(hours);
  const minutesStr = minutes < 10 ? "0" + minutes : String(minutes);
  
  return hoursStr + "h " + minutesStr + "m";
}

export function formatDateTime(dateTimeStr: string): string {
  try {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateTimeStr;
  }
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
