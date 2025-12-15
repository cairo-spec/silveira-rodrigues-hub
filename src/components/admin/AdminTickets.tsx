import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";

const AdminTickets = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Gestão de Tickets</h3>
      <p className="text-muted-foreground text-center">Painel de tickets em desenvolvimento</p>
    </CardContent>
  </Card>
);

export default AdminTickets;
