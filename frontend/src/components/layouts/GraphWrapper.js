// Graph_4_Wrapper.jsx
import { ReactFlowProvider } from "reactflow";
import { useParams } from "react-router-dom";
import Graph from "../../components/Graph";

export default function Graph_4_Wrapper() {
  const { id } = useParams(); // kommt aus /graph/:id

  return (
    <ReactFlowProvider>
      <Graph id_that_was_passed={id} />
    </ReactFlowProvider>
  );
}
