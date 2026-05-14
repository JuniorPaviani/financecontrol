import { Loader2 } from "lucide-react";
import { C } from "../../styles/theme";

export default function Loading() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300,gap:14}}>
      <Loader2 size={28} color={C.accent} style={{animation:"spin .9s linear infinite"}}/>
      <span style={{fontSize:12,color:C.muted}}>Carregando...</span>
    </div>
  );
}
