import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface AccountSecurityCardProps {
  onManagePassword: () => void;
}

const AccountSecurityCard = ({
  onManagePassword,
}: AccountSecurityCardProps) => (
  <Card className="p-6 bg-gradient-card border-none shadow-soft">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-bold mb-1">Account Security</h3>
        <p className="text-sm text-muted-foreground">
          Update your password regularly to keep your wardrobe safely in sync.
        </p>
      </div>
      <div className="rounded-full bg-primary/10 p-2 text-primary">
        <ShieldCheck className="h-5 w-5" />
      </div>
    </div>
    <Separator className="my-4" />
    <Button className="w-full" variant="outline" onClick={onManagePassword}>
      Manage Password
    </Button>
  </Card>
);

export default AccountSecurityCard;
