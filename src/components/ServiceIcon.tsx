import React from "react";
import { 
  Cloud, 
  Wifi, 
  Tv, 
  Code, 
  Zap, 
  Play, 
  Bot, 
  ShoppingBag, 
  CreditCard,
  ShieldCheck,
  Smartphone,
  Sparkles,
  FileText,
  Activity,
  Server,
  Globe,
  Film,
  Music,
  Send,
  Home,
  Armchair,
  Keyboard,
  GraduationCap,
  Package,
  Layers,
  FileSpreadsheet,
  Headphones
} from "lucide-react";

interface ServiceIconProps {
  icon: string;
  className?: string;
  size?: number;
}

export const ServiceIcon: React.FC<ServiceIconProps> = ({ icon, className = "w-4 h-4", size = 16 }) => {
  switch (icon.toLowerCase()) {
    case "spotify":
    case "music":
    case "headphones":
      return <Music size={size} className={className} />;
    case "cloud":
    case "icloud":
      return <Cloud size={size} className={className} />;
    case "wifi":
    case "internet":
      return <Wifi size={size} className={className} />;
    case "tv":
    case "netflix":
      return <Tv size={size} className={className} />;
    case "code":
    case "github":
      return <Code size={size} className={className} />;
    case "zap":
    case "electricity":
    case "utilities":
      return <Zap size={size} className={className} />;
    case "play":
    case "youtube":
      return <Play size={size} className={className} />;
    case "bot":
    case "chatgpt":
    case "ai":
      return <Bot size={size} className={className} />;
    case "shopping-bag":
    case "amazon":
      return <ShoppingBag size={size} className={className} />;
    case "smartphone":
    case "phone":
    case "mobile":
      return <Smartphone size={size} className={className} />;
    case "shield":
    case "shield-check":
    case "insurance":
      return <ShieldCheck size={size} className={className} />;
    case "sparkles":
      return <Sparkles size={size} className={className} />;
    case "file-text":
      return <FileText size={size} className={className} />;
    case "activity":
      return <Activity size={size} className={className} />;
    case "server":
      return <Server size={size} className={className} />;
    case "film":
      return <Film size={size} className={className} />;
    case "globe":
      return <Globe size={size} className={className} />;
    case "send":
    case "telegram":
      return <Send size={size} className={className} />;
    case "home":
    case "rent":
      return <Home size={size} className={className} />;
    case "armchair":
    case "furniture":
      return <Armchair size={size} className={className} />;
    case "keyboard":
      return <Keyboard size={size} className={className} />;
    case "graduation-cap":
    case "course":
    case "education":
      return <GraduationCap size={size} className={className} />;
    case "layers":
      return <Layers size={size} className={className} />;
    case "package":
      return <Package size={size} className={className} />;
    case "document":
      return <FileSpreadsheet size={size} className={className} />;
    default:
      return <CreditCard size={size} className={className} />;
  }
};

export const AVAILABLE_ICONS = [
  { id: "tv", label: "Streaming / TV" },
  { id: "music", label: "Music / Audio" },
  { id: "bot", label: "AI / Assistant" },
  { id: "cloud", label: "Cloud / Backup" },
  { id: "code", label: "Developer / Code" },
  { id: "send", label: "Messenger / Chat" },
  { id: "wifi", label: "Internet / Wi-Fi" },
  { id: "home", label: "Housing / Rent" },
  { id: "zap", label: "Utilities / Electricity" },
  { id: "shield-check", label: "Insurance / Health" },
  { id: "smartphone", label: "Phone / Electronics" },
  { id: "armchair", label: "Furniture / Home" },
  { id: "keyboard", label: "Hardware / Peripherals" },
  { id: "graduation-cap", label: "Education / Course" },
  { id: "credit-card", label: "General Payment" },
  { id: "sparkles", label: "Service / Misc" },
];
