"use client";

import { TicketPercent } from "lucide-react";
import { Input } from "@/components/ui/input";

type PromoterCouponFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export default function PromoterCouponField({
  value,
  onChange,
  placeholder,
  label = "Cupom",
  description,
  disabled = false,
}: PromoterCouponFieldProps) {
  return (
    <div className="rounded-md border border-dashed border-emerald-300 bg-emerald-50 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded-full bg-emerald-100 p-1.5 text-emerald-700">
          <TicketPercent className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-900">{label}</div>
          {description ? (
            <div className="text-xs text-emerald-800/80">{description}</div>
          ) : null}
        </div>
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="border-emerald-200 bg-white focus-visible:ring-emerald-500"
      />
    </div>
  );
}
