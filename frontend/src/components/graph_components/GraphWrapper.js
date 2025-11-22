// Graph_4_Wrapper.jsx
import { ReactFlowProvider } from "reactflow";
import { useParams } from "react-router-dom";
import Graph from "./Graph";

export default function Graph_4_Wrapper() {
  const { id } = useParams(); // from /graph/:id

  return (
    <ReactFlowProvider>
      <Graph
        key={id}                 // 👈 this forces a fresh Graph when id changes
        id_that_was_passed={id}
      />
    </ReactFlowProvider>
  );
}
