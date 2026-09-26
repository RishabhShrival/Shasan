import { RESOURCE_TYPES, type ResourceType, type Resources } from "@/game/types";
import { IDEOLOGY_STYLES } from "@/lib/ideology";
import { cn } from "@/lib/utils";

export function IdeologyChip({ type, amount, className }: { type: ResourceType; amount?: number; className?: string }) {
  const style = IDEOLOGY_STYLES[type];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em]", className)}
      style={{ borderColor: `${style.color}88`, backgroundColor: `${style.color}22`, color: style.text }}
      title={style.label}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: style.color }} />
      {amount !== undefined ? `${amount} ` : ""}{style.short}
    </span>
  );
}

/** Compact list of non-zero resources, e.g. a card cost or a reward. */
export function ResourceList({ resources, emptyLabel = "—", className }: { resources: Resources; emptyLabel?: string; className?: string }) {
  const entries = RESOURCE_TYPES.filter((type) => resources[type] > 0);
  if (entries.length === 0) return <span className="text-xs text-[#7d8a9b]">{emptyLabel}</span>;
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {entries.map((type) => <IdeologyChip key={type} type={type} amount={resources[type]} />)}
    </span>
  );
}

/** Horizontal stacked bar of an ideology profile. */
export function IdeologyBar({ profile, className }: { profile: Record<ResourceType, number>; className?: string }) {
  const total = RESOURCE_TYPES.reduce((sum, type) => sum + profile[type], 0);
  return (
    <div className={cn("flex h-1.5 overflow-hidden rounded-full bg-white/[0.07]", className)} aria-label="Ideology profile">
      {total > 0 && RESOURCE_TYPES.map((type) => (
        <span key={type} style={{ width: `${(profile[type] / total) * 100}%`, backgroundColor: IDEOLOGY_STYLES[type].color }} />
      ))}
    </div>
  );
}

/** +/- steppers used to choose a set of resources (sealed card payment, power choices). */
export function ResourceStepper({
  owned,
  value,
  onChange,
  max,
}: {
  owned?: Resources;
  value: Resources;
  onChange: (next: Resources) => void;
  max: number;
}) {
  const total = RESOURCE_TYPES.reduce((sum, type) => sum + value[type], 0);
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {RESOURCE_TYPES.map((type) => {
        const style = IDEOLOGY_STYLES[type];
        const limit = owned ? owned[type] : max;
        return (
          <div key={type} className="flex items-center justify-between gap-1 rounded-sm border px-1.5 py-1" style={{ borderColor: `${style.color}55`, backgroundColor: `${style.color}14` }}>
            <button type="button" aria-label={`Remove ${style.label}`} className="size-6 text-sm text-[#c9d2de] disabled:opacity-30" disabled={value[type] < 1} onClick={() => onChange({ ...value, [type]: value[type] - 1 })}>−</button>
            <span className="text-center text-[11px] font-bold" style={{ color: style.text }}>
              {value[type]} {style.short}
              {owned ? <span className="block text-[9px] font-normal text-[#7d8a9b]">have {owned[type]}</span> : null}
            </span>
            <button type="button" aria-label={`Add ${style.label}`} className="size-6 text-sm text-[#c9d2de] disabled:opacity-30" disabled={total >= max || value[type] >= limit} onClick={() => onChange({ ...value, [type]: value[type] + 1 })}>+</button>
          </div>
        );
      })}
    </div>
  );
}
