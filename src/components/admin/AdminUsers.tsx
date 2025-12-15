import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

const AdminUsers = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Gestão de Usuários</h3>
      <p className="text-muted-foreground text-center">Painel de usuários em desenvolvimento</p>
    </CardContent>
  </Card>
);

export default AdminUsers;
