import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { LucideIcon } from "lucide-react";

export interface ClientInsight {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface PersonalSnapshotCardProps {
  insights: ClientInsight[];
  primaryEmail: string;
  memberStatus: string;
}

const PersonalSnapshotCard = ({
  insights,
  primaryEmail,
  memberStatus,
}: PersonalSnapshotCardProps) => (
  <Card className="p-6 bg-[#ED7B6F] border-none shadow-soft">
    <h3 className="text-xl font-bold text-accent-foreground mb-4">
      Personal Snapshot
    </h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {insights.map((insight) => {
        const InsightIcon = insight.icon;
        return (
          <div
            key={insight.label}
            className="rounded-lg bg-background/20 p-3 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground/80">
              <InsightIcon className="h-4 w-4 text-accent-foreground" />
              {insight.label}
            </div>
            <p className="mt-2 text-lg font-semibold text-accent-foreground">
              {insight.value}
            </p>
          </div>
        );
      })}
    </div>
    <Separator className="my-4 bg-accent-foreground/20" />
    <div className="space-y-1 text-xs text-accent-foreground/80">
      <p>Primary Email: {primaryEmail}</p>
      <p>Member Status: {memberStatus}</p>
    </div>
  </Card>
);

export default PersonalSnapshotCard;
