"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMessage, setMessageRead } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function MessageActions({ id, isRead, email, topic }: { id: string; isRead: boolean; email: string; topic: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>, message: string) =>
    startTransition(async () => {
      await fn();
      toast(message);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button asChild variant="outline" size="sm">
        <a href={`mailto:${email}?subject=${encodeURIComponent(`Re: your ${topic} enquiry`)}`}>Reply</a>
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => setMessageRead({ id, isRead: !isRead }), isRead ? "Marked unread" : "Marked read")}>
        {isRead ? <Mail /> : <MailOpen />} {isRead ? "Mark unread" : "Mark read"}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => deleteMessage({ id }), "Message deleted")} aria-label="Delete message">
        <Trash2 className="text-destructive" />
      </Button>
    </div>
  );
}
