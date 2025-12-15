import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const AdminKnowledgeBase = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Base de Conhecimento</h3>
      <p className="text-muted-foreground text-center">Gestão de artigos em desenvolvimento</p>
    </CardContent>
  </Card>
);

export default AdminKnowledgeBase;
