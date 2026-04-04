export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollInitiative(bonus: number): number {
  return rollD20() + bonus;
}

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function formatStat(score: number): string {
  const mod = getModifier(score);
  return `${score} (${formatModifier(mod)})`;
}

export function hpPercent(hp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, (hp / maxHp) * 100));
}

export function hpColor(percent: number): string {
  if (percent > 66) return "#22c55e";
  if (percent > 33) return "#f59e0b";
  return "#ef4444";
}

export function crToNumber(cr: string): number {
  if (cr === "1/8") return 0.125;
  if (cr === "1/4") return 0.25;
  if (cr === "1/2") return 0.5;
  return parseFloat(cr) || 0;
}

export function speedString(speed: Record<string, number | undefined>): string {
  const parts: string[] = [];
  if (speed.walk) parts.push(`${speed.walk} ft.`);
  if (speed.fly) parts.push(`fly ${speed.fly} ft.`);
  if (speed.swim) parts.push(`swim ${speed.swim} ft.`);
  if (speed.climb) parts.push(`climb ${speed.climb} ft.`);
  if (speed.burrow) parts.push(`burrow ${speed.burrow} ft.`);
  return parts.join(", ") || "0 ft.";
}

export const CONDITIONS = [
  { name: "Blinded", icon: "" },
  { name: "Charmed", icon: "" },
  { name: "Deafened", icon: "" },
  { name: "Exhaustion", icon: "" },
  { name: "Frightened", icon: "" },
  { name: "Grappled", icon: "" },
  { name: "Incapacitated", icon: "" },
  { name: "Invisible", icon: "" },
  { name: "Paralyzed", icon: "" },
  { name: "Petrified", icon: "" },
  { name: "Poisoned", icon: "" },
  { name: "Prone", icon: "" },
  { name: "Restrained", icon: "" },
  { name: "Stunned", icon: "" },
  { name: "Unconscious", icon: "" },
  { name: "Concentration", icon: "" },
  { name: "Dead", icon: "" },
];

export function exportJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readJSONFile<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
