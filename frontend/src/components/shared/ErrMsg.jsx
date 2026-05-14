import { AlertCircle } from "lucide-react";
import { C } from "../../styles/theme";

export default function ErrMsg({msg}) {
  return (
    <div style={{padding:"13px 16px",borderRadius:9,background:C.redSft,border:`1px solid ${C.red}33`,
      color:C.red,fontSize:13,display:"flex",alignItems:"center",gap:9}}>
      <AlertCircle size={15}/>{msg}
    </div>
  );
}
