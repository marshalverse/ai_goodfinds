import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Heart, MessageCircle, Info, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Link } from "wouter";
import { useState } from "react";

export default function NotificationCenter() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const { data: notifications, refetch } = trpc.notifications.list.useQuery(
    { limit: 30 },
    { enabled: isAuthenticated && open }
  );

  const utils = trpc.useUtils();

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      refetch();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      refetch();
    },
  });

  if (!isAuthenticated) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="w-4 h-4 text-rose-400" />;
      case "comment": return <MessageCircle className="w-4 h-4 text-blue-400" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const count = unreadCount || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground text-sm">通知</h3>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-7"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-3.5 h-3.5" /> 全部已讀
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border/30">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 cursor-pointer ${
                    !notif.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (!notif.isRead) {
                      markAsReadMutation.mutate({ id: notif.id });
                    }
                    if (notif.relatedPostId) {
                      setOpen(false);
                    }
                  }}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    {notif.relatedPostId ? (
                      <Link
                        href={`/posts/${notif.relatedPostId}`}
                        onClick={() => setOpen(false)}
                        className="block"
                      >
                        <p className="text-sm text-foreground/90 leading-snug line-clamp-2">
                          {notif.message}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-sm text-foreground/90 leading-snug line-clamp-2">
                        {notif.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: zhTW })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">暫無通知</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
