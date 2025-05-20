export function toInputDateString(dateString: string): string {
  return new Date(dateString).toISOString().split("T")[0];
}
