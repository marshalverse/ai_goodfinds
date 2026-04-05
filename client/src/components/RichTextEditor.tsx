import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import FontSize from "@tiptap/extension-font-size";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Highlighter, Undo, Redo,
  Palette, Minus, AArrowUp, AArrowDown,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

const TEXT_COLORS = [
  "#ffffff", "#f8f9fa", "#adb5bd", "#868e96", "#495057",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6",
];

const HIGHLIGHT_COLORS = [
  "transparent", "#fef08a", "#bbf7d0", "#bfdbfe", "#ddd6fe",
  "#fecdd3", "#fed7aa", "#a5f3fc", "#fde68a", "#c4b5fd",
];

const FONT_SIZES = [
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "36", value: "36px" },
  { label: "48", value: "48px" },
];

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.upload.image.useMutation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full mx-auto my-4" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: placeholder || "開始撰寫您的文章..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[300px] focus:outline-none px-4 py-3 text-foreground",
      },
    },
  });

  // Sync content from parent (for edit mode)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("圖片大小不能超過 5MB");
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          mimeType: file.type,
          fileName: file.name,
        });
        editor.chain().focus().setImage({ src: result.url }).run();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("圖片上傳失敗，請重試");
    }
  }, [editor, uploadMutation]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = "";
  };

  const setLink = () => {
    if (!editor || !linkUrl) return;
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkUrl("");
    setLinkOpen(false);
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setLinkOpen(false);
  };

  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive, children, title }: {
    onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border/40 bg-muted/30">
        {/* Undo/Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="復原">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="重做">
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="標題 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="標題 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="標題 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground text-xs" title="字體大小">
              <AArrowUp className="w-3.5 h-3.5" />
              <span className="text-xs">字級</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2" align="start">
            <p className="text-xs text-muted-foreground mb-2 px-1">字體大小</p>
            <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  type="button"
                  className={`text-left px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                    editor.getAttributes("textStyle").fontSize === fs.value ? "bg-accent text-accent-foreground" : "text-foreground"
                  }`}
                  style={{ fontSize: fs.value }}
                  onClick={() => editor.chain().focus().setFontSize(fs.value).run()}
                >
                  {fs.label}px
                </button>
              ))}
              <button
                type="button"
                className="text-left px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border-t border-border/30 mt-1 pt-2"
                onClick={() => editor.chain().focus().unsetFontSize().run()}
              >
                重置大小
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Text formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="粗體">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="斜體">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="底線">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="刪除線">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="文字顏色">
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <p className="text-xs text-muted-foreground mb-2">文字顏色</p>
            <div className="grid grid-cols-5 gap-1.5">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-7 h-7 rounded-md border border-border/50 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                />
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => editor.chain().focus().unsetColor().run()}>
              重置顏色
            </Button>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="螢光標記">
              <Highlighter className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <p className="text-xs text-muted-foreground mb-2">螢光標記</p>
            <div className="grid grid-cols-5 gap-1.5">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-7 h-7 rounded-md border border-border/50 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color === "transparent" ? "transparent" : color }}
                  onClick={() => {
                    if (color === "transparent") {
                      editor.chain().focus().unsetHighlight().run();
                    } else {
                      editor.chain().focus().toggleHighlight({ color }).run();
                    }
                  }}
                >
                  {color === "transparent" && <Minus className="w-4 h-4 mx-auto text-muted-foreground" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="靠左對齊">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="置中對齊">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="靠右對齊">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="無序列表">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="有序列表">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Block elements */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="引用">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} title="程式碼區塊">
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Link */}
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className={`h-8 w-8 ${editor.isActive("link") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`} title="插入連結">
              <LinkIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <p className="text-xs text-muted-foreground mb-2">插入連結</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && setLink()}
              />
              <Button type="button" size="sm" className="h-8" onClick={setLink}>確認</Button>
            </div>
            {editor.isActive("link") && (
              <Button type="button" variant="ghost" size="sm" className="w-full mt-2 text-xs text-destructive" onClick={removeLink}>
                移除連結
              </Button>
            )}
          </PopoverContent>
        </Popover>

        {/* Image Upload */}
        <ToolbarButton onClick={handleImageClick} title="上傳圖片">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-[300px]" />

      {/* Upload indicator */}
      {uploadMutation.isPending && (
        <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/30 border-t border-border/40">
          正在上傳圖片...
        </div>
      )}
    </div>
  );
}
