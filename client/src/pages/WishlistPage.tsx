import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, Send, Star, Lightbulb, MessageSquarePlus } from "lucide-react";

export default function WishlistPage() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.wishlist.submit.useMutation({
    onSuccess: () => {
      toast.success("許願成功！我們已收到您的建議。");
      setSubmitted(true);
      setSubject("");
      setContent("");
      setEmail("");
    },
    onError: (err) => {
      toast.error("提交失敗：" + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast.error("請填寫主旨和內容");
      return;
    }
    submitMutation.mutate({
      subject: subject.trim(),
      content: content.trim(),
      email: email.trim() || undefined,
    });
  };

  return (
    <div className="container max-w-3xl py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/20 mb-4">
          <Star className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-3">許願池</h1>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          告訴我們您希望在 AI好物誌 上看到什麼新功能或內容。您的每一個建議都是我們進步的動力。
        </p>
      </div>

      {/* Inspiration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <Lightbulb className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">新增 AI 工具分類</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <MessageSquarePlus className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">功能改進建議</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">內容主題建議</p>
          </CardContent>
        </Card>
      </div>

      {submitted ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 mb-4">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">感謝您的許願！</h2>
            <p className="text-muted-foreground mb-6">
              我們已收到您的建議，團隊會認真評估並考慮納入未來的更新計畫中。
            </p>
            <Button onClick={() => setSubmitted(false)} className="bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0">
              繼續許願
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              提交您的願望
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">主旨 *</label>
                <Input
                  placeholder="例如：希望新增 Gemini 工具分類"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-background"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">詳細內容 *</label>
                <Textarea
                  placeholder="請描述您的建議或需求，越詳細越好..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-background min-h-[160px] resize-y"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{content.length}/5000</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">聯絡信箱（選填）</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">留下信箱，我們可以在實現您的願望時通知您。</p>
              </div>

              <Button
                type="submit"
                disabled={submitMutation.isPending || !subject.trim() || !content.trim()}
                className="w-full bg-gradient-to-r from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] hover:opacity-90 text-white border-0 h-11"
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提交中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    送出許願
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
