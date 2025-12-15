import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const AdminChats = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Chats ao Vivo</h3>
      <p className="text-muted-foreground text-center">Gestão de chats em desenvolvimento</p>
    </CardContent>
  </Card>
);

export default AdminChats;
