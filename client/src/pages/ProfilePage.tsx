import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, FileText, Calendar, Camera, Pencil, Check, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import PostCard from "@/components/PostCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useCallback } from "react";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || "0");
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading } = trpc.profile.get.useQuery({ userId }, { enabled: userId > 0 });
  const utils = trpc.useUtils();

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate({ userId });
      utils.auth.me.invalidate();
    },
  });

  const uploadImage = trpc.upload.image.useMutation();

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [bioValue, setBioValue] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === userId;

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(language === "zh" ? "圖片大小不能超過 5MB" : "Image size must be under 5MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadImage.mutateAsync({
          base64,
          mimeType: file.type,
          fileName: file.name,
        });
        await updateProfile.mutateAsync({ avatarUrl: result.url });
        setUploadingAvatar(false);
      };
      reader.onerror = () => {
        setUploadingAvatar(false);
        alert(language === "zh" ? "圖片讀取失敗" : "Failed to read image");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      setUploadingAvatar(false);
      alert(language === "zh" ? "上傳失敗，請重試" : "Upload failed, please try again");
    }
  }, [uploadImage, updateProfile, language]);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarUpload(file);
    e.target.value = "";
  };

  const startEditName = () => {
    setNameValue(profile?.name || "");
    setEditingName(true);
  };

  const saveName = async () => {
    if (!nameValue.trim()) return;
    await updateProfile.mutateAsync({ name: nameValue.trim() });
    setEditingName(false);
  };

  const startEditBio = () => {
    setBioValue(profile?.bio || "");
    setEditingBio(true);
  };

  const saveBio = async () => {
    await updateProfile.mutateAsync({ bio: bioValue.trim() });
    setEditingBio(false);
  };

  if (isLoading) {
    return (
      <div className="container py-16 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-muted" />
            <div className="space-y-3"><div className="h-6 w-40 bg-muted rounded" /><div className="h-4 w-60 bg-muted rounded" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="container py-16 text-center"><p className="text-muted-foreground">{language === "zh" ? "找不到此用戶" : "User not found"}</p></div>;
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-start gap-6 mb-8">
        {/* Avatar with upload */}
        <div className="relative group shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name || "Avatar"}
              className="w-24 h-24 rounded-full object-cover shadow-lg shadow-primary/20 border-2 border-border/30"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[oklch(0.637_0.237_311)] to-[oklch(0.6_0.2_260)] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20">
              {profile.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          {isOwnProfile && (
            <>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name with edit */}
          <div className="flex items-center gap-2 mb-1">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder={t("profile.namePlaceholder")}
                  className="h-9 text-lg font-bold max-w-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                  onClick={saveName}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingName(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">{profile.name || (language === "zh" ? "匿名用戶" : "Anonymous")}</h1>
                {isOwnProfile && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={startEditName}
                    title={t("profile.editName")}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Bio with edit */}
          <div className="mb-3">
            {editingBio ? (
              <div className="space-y-2">
                <Textarea
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                  placeholder={t("profile.bioPlaceholder")}
                  className="min-h-[80px] text-sm resize-none"
                  autoFocus
                  maxLength={500}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs px-3"
                    onClick={saveBio}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <><Loader2 className="w-3 h-3 animate-spin mr-1" />{t("profile.saving")}</>
                    ) : (
                      t("profile.save")
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-3"
                    onClick={() => setEditingBio(false)}
                  >
                    {t("profile.cancel")}
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">{bioValue.length}/500</span>
                </div>
              </div>
            ) : (
              <div className="group/bio flex items-start gap-1">
                {profile.bio ? (
                  <p className="text-muted-foreground leading-relaxed text-sm">{profile.bio}</p>
                ) : (
                  isOwnProfile && (
                    <p className="text-muted-foreground/50 text-sm italic">{t("profile.addBio")}</p>
                  )
                )}
                {isOwnProfile && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover/bio:opacity-100 transition-opacity shrink-0 mt-0.5"
                    onClick={startEditBio}
                    title={t("profile.editBio")}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{language === "zh" ? "加入於" : "Joined"} {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true, locale: language === "zh" ? zhTW : undefined })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{profile.postCount}</div>
            <div className="text-xs text-muted-foreground">{t("profile.posts")}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 text-rose-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{profile.totalLikes}</div>
            <div className="text-xs text-muted-foreground">{t("profile.likes")}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{profile.preferredTools?.length || 0}</div>
            <div className="text-xs text-muted-foreground">{t("profile.tools")}</div>
          </CardContent>
        </Card>
      </div>

      {profile.preferredTools && profile.preferredTools.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">{t("profile.preferredTools")}</h2>
          <div className="flex flex-wrap gap-2">
            {profile.preferredTools.map((tool: any) => (
              <Badge key={tool.id} variant="outline" style={{ borderColor: `${tool.color}40`, color: tool.color || undefined }}>
                {tool.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("profile.publishedPosts")}</h2>
        {profile.posts && profile.posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {profile.posts.map((post: any) => (
              <PostCard key={post.id} post={{ ...post, author: { id: profile.id, name: profile.name, avatarUrl: profile.avatarUrl } }} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">{t("search.noResults")}</p>
        )}
      </div>
    </div>
  );
}
