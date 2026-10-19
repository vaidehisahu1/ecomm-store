import { cn } from "@/lib/utils";

/** Long-form legal/help copy with consistent rhythm. */
export function Prose({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "max-w-3xl text-[16px] leading-[1.75] text-foreground/80",
        "[&_h2]:mt-14 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-foreground [&_h2:first-child]:mt-0",
        "[&_h3]:mt-8 [&_h3]:font-medium [&_h3]:text-foreground",
        "[&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4",
        "[&_table]:mt-6 [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:py-3 [&_th]:text-left [&_th]:font-medium [&_td]:border-b [&_td]:py-3",
        className,
      )}
      {...props}
    />
  );
}
