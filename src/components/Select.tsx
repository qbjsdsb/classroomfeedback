import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

export interface SelectOption<T> {
  value: T;
  label: string;
}

export function Select<T extends string | number>({
  value,
  options,
  placeholder,
  onChange,
  className,
}: {
  value: T | null;
  options: SelectOption<T>[];
  placeholder?: string;
  onChange: (v: T) => void;
  className?: string;
}) {
  const current = options.find(o => o.value === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton className={clsx("input flex items-center justify-between text-left", className)}>
        <span className={current ? "text-text" : "text-text-muted"}>
          {current?.label ?? placeholder ?? "请选择…"}
        </span>
        <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
      </ListboxButton>
      <ListboxOptions className="mt-1 w-full rounded-md border border-border bg-surface shadow-card-hover focus:outline-none z-10">
        {options.map(o => (
          <ListboxOption
            key={String(o.value)}
            value={o.value}
            className={({ active }: { active: boolean }) =>
              clsx("px-3 py-2 text-sm cursor-pointer", active ? "bg-primary-surface text-primary" : "text-text")
            }
          >
            {o.label}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
