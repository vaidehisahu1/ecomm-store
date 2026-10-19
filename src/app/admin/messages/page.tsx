import { Inbox } from "lucide-react";
import { MessageActions } from "@/components/admin/message-actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { cn, formatDate, initials } from "@/lib/utils";

export const metadata = { title: "Messages" };

const topicLabel: Record<string, string> = { order: "Order", product: "Product", returns: "Returns", press: "Press", other: "Other" };

export default async function MessagesPage() {
  const messages = await db.contactMessage.findMany({ orderBy: [{ isRead: "asc" }, { createdAt: "desc" }] });
  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <>
      <AdminPageHeader title="Messages" description={`${unread} unread of ${messages.length}`} />
      {messages.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed py-20 text-center text-muted-foreground">
          <Inbox className="size-9" strokeWidth={1.4} />
          <p className="mt-4">Inbox zero. Nicely done.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={cn("rounded-2xl border bg-card p-5 sm:p-6", !m.isRead && "border-l-4 border-l-accent")}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-[12px] font-semibold">{initials(m.name)}</span>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {m.name} <Badge variant="outline">{topicLabel[m.topic] ?? m.topic}</Badge>
                      {!m.isRead && <Badge variant="accent">New</Badge>}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {m.email} · {formatDate(m.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <MessageActions id={m.id} isRead={m.isRead} email={m.email} topic={topicLabel[m.topic]?.toLowerCase() ?? "message"} />
              </div>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/85">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
