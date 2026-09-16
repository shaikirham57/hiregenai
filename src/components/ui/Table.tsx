import { forwardRef, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function TableContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("w-full overflow-x-auto rounded-lg border border-line", className)}>{children}</div>;
}

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <table ref={ref} className={cn("w-full min-w-max border-collapse text-left text-sm", className)} {...props} />
));
Table.displayName = "Table";

export const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("bg-sunken", className)} {...props} />
);
TableHead.displayName = "TableHead";

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn("divide-y divide-line", className)} {...props} />
);
TableBody.displayName = "TableBody";

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("transition-colors hover:bg-sunken/60", className)} {...props} />
  )
);
TableRow.displayName = "TableRow";

export const TableHeadCell = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn("whitespace-nowrap px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted", className)}
      {...props}
    />
  )
);
TableHeadCell.displayName = "TableHeadCell";

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => <td ref={ref} className={cn("px-4 py-3.5 align-middle text-ink", className)} {...props} />
);
TableCell.displayName = "TableCell";
