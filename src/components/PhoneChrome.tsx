import { BatteryMedium, Signal, Wifi } from "lucide-react";
import type { ReactNode } from "react";

type PhoneChromeProps = {
  children: ReactNode;
};

export function PhoneChrome({ children }: PhoneChromeProps) {
  return (
    <div className="phone-screen">
      <div className="status-bar" aria-hidden="true">
        <span>9:41</span>
        <span className="status-icons">
          <Signal size={15} strokeWidth={2.4} />
          <Wifi size={16} strokeWidth={2.4} />
          <BatteryMedium size={20} strokeWidth={2.2} />
        </span>
      </div>
      <div className="phone-content">{children}</div>
      <div className="home-indicator" aria-hidden="true" />
    </div>
  );
}
