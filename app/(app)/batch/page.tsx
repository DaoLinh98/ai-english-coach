import { BatchScreen } from "@/components/screens/BatchScreen";
import { analyzeText } from "../editor/actions";

export default function BatchPage() {
  return <BatchScreen analyzeText={analyzeText} />;
}
