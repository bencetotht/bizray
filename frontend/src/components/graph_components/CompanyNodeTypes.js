import { Handle } from "reactflow";
import StoreIcon from '@mui/icons-material/Store';
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';




function MainCompanyDisplay({ data, selected }) {
    return (
        <>
            <div className={`
${selected ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-indigo-300 to-purple-400'}
h-20 w-60 
flex
p-2
rounded
shadow-xl




!p-2
flex
justify-center
items-center
text-xl
relative
  rounded-2xl 
  bg-purple-500/15
  backdrop-blur-xl 
  border border-white/30 
  shadow-xl
  p-6


            `}>
                <h1 className="m-2 ">{data.label}</h1>
                <Handle type="source" position="bottom" />
                <Handle type="target" position="top" />
            </div>
        </>
    )
}

function DefaultCompanyDisplay({ id, selected, data }) {
    const navigate = useNavigate();

    return (
        <div 
        onDoubleClick={(e)=>{
                e.stopPropagation();
                data.changeNodeType(id, "minimal_company_display");
            }}
        className={`
${selected ? 'bg-blue-500/20 shadow-xl shadow-black/20' : 'bg-blue-400/15 '}
h-32
w-45
rounded
shadow-xl
!p-3
flex
flex-col
gap-2
justify-center
items-center
text-black

relative
  rounded-2xl 
  
  backdrop-blur-xl 
  border border-white/30 
  shadow-xl
  p-6

                    
                    
                    `}>
            {data.label}
            <Handle type="source" position="bottom" />
            <Handle type="target" position="top" />
            <div className="flex gap-2 justify-center">
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        // console.log("Expand triggered, i am : ", id)
                        data.fetchCompany(id)

                    }}
                    className="bg-white p-2 w-8 h-8 flex justify-center items-center rounded hover:bg-gray-200">

                    <OpenInFullIcon className="!text-[25px]" />
                </div>
                <div
                    onClick={(e) => {
                        e.stopPropagation();

                        // console.log("Collapse triggered, i am : ", id)
                        data.collapseCompany(id);
                    }}
                    className="bg-white p-2 w-8 h-8 flex justify-center items-center rounded hover:bg-gray-200">
                    <CloseFullscreenIcon className="!text-[25px]" />
                </div>
                {/* Navigate to /graph/:id */}
        <button
          onClick={(e) => {
            e.stopPropagation();       
            navigate(`/graph/${id}`);   
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          <span className="flex items-center gap-2">
            Network
            <ExternalLink size={16} />
          </span>
        </button>


            </div>

        </div>
    );
}



function DetailedCompanyDisplay({}){

}

function MinimalCompanyDisplay({id, selected, data}){
    return (
        <>
            <div 
            onDoubleClick={(e)=>{
                e.stopPropagation();
                data.changeNodeType(id, "default_company_display");
            }}
            className="h-15 w-15 bg-white rounded-full flex justify-center items-center shadow-xl shadow-black/20">
                <StoreIcon className="!text-[35px]"/>
                <Handle type="source" position="bottom" />
                <Handle type="target" position="top" />
                
               
            </div>
        </>
    )
}







export const companyNodeTypes = {
  default_company_display: DefaultCompanyDisplay,
  main_company_display: MainCompanyDisplay,
  minimal_company_display: MinimalCompanyDisplay,
};