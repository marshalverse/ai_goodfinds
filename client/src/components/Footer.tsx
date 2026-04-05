import { Mail, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663513894733/EMmCrr8wS6ruYCgz6zaGkz/logo_8b48a01d.png";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Logo + Company */}
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="AI好物誌" className="w-8 h-8 rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-foreground">AI好物誌</p>
              <p className="text-xs text-muted-foreground">AI GoodFinds</p>
            </div>
          </div>

          {/* Center: Copyright */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} <span className="font-medium text-foreground/80">{t("footer.company")}</span>
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {t("footer.description")}
            </p>
          </div>

          {/* Right: Contact */}
          <div className="flex flex-col items-center md:items-end gap-1">
            <a
              href="mailto:marshalvision.co@gmail.com"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              marshalvision.co@gmail.com
            </a>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Globe className="w-3 h-3" />
              marshalvision.co
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
