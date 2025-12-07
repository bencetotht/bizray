import { Handle } from "reactflow";
import StoreIcon from "@mui/icons-material/Store";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import { useMemo, useState } from "react";

function getInitial(label) {
  if (!label || typeof label !== "string") return "?";
  return label.trim().charAt(0).toUpperCase();
}

/* ---------- MAIN COMPANY NODE ---------- */

function MainCompanyDisplay({ id, data, selected }) {
  const navigate = useNavigate();

  return (
    <div
      className={`
        rounded-2xl
        shadow-xl
        border border-white/40
        backdrop-blur-xl
        bg-gradient-to-br
        !py-5
        ${
          selected
            ? "from-indigo-500 to-purple-500"
            : "from-indigo-400 to-purple-500"
        }
        text-white
        min-w-[220px] max-w-xs
        flex flex-col
        justify-center items-center gap-5
      `}
      style={{ padding: "14px 16px" }}
    >
      {/* Title */}
      <div className="w-full flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <StoreIcon className="!text-[20px] opacity-90" />
          <h1 className="font-semibold text-sm md:text-base leading-snug break-words">
            {data.label}
          </h1>
        </div>
       
      </div>

      {/* Actions */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/company/${id}`);
          }}
          className="
            bg-white text-indigo-600
            !px-3 !py-1.5
            rounded-xl
            flex items-center gap-1.5
            text-[11px] md:text-xs font-medium
            shadow-sm
            hover:bg-indigo-50
            transition-all duration-150
          "
        >
          Detail Page
          <ExternalLink size={14} />
        </button>
      </div>

      <Handle type="source" position="bottom" />
      <Handle type="target" position="top" />
    </div>
  );
}

/* ---------- DEFAULT COMPANY NODE (MEDIUM) ---------- */

function DefaultCompanyDisplay({ id, selected, data }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className={`
        rounded-2xl
        border
        backdrop-blur-xl
        bg-white/90
        ${
          selected
            ? "border-indigo-500 ring-2 ring-indigo-200 shadow-lg"
            : "border-slate-200 shadow-md hover:shadow-lg hover:border-indigo-300"
        }
        w-50 h-23
        flex flex-col justify-between
        text-xs md:text-sm text-slate-800
        transition-all duration-150
      `}
      style={{ padding: "10px 12px" }}
    >
      {/* Title + meta */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            <StoreIcon className="!text-[18px] text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[11px] md:text-xs leading-snug break-words">
              {data.label}
            </div>
          </div>
        </div>
        
      </div>

      <Handle type="source" position="bottom" />
      <Handle type="target" position="top" />

      {/* Controls */}
      <div className="flex justify-between items-center mt-1 gap-2">

        <div className="w-full flex justify-center">
            <div className="flex gap-2">
          {/* Expand / Collapse */}
          {!expanded ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
                data.fetchCompany(id);
              }}
              className="
                bg-white border border-slate-200
                w-8 h-8 rounded-lg
                flex items-center justify-center
                hover:bg-slate-50
                transition-all duration-150
              "
              title="Expand network from this company"
            >
              <OpenInFullIcon className="!text-[20px] text-slate-700" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
                data.collapseCompany(id);
              }}
              className="
                bg-white border border-slate-200
                w-8 h-8 rounded-lg
                flex items-center justify-center
                hover:bg-slate-50
                transition-all duration-150
              "
              title="Collapse children"
            >
              <CloseFullscreenIcon className="!text-[20px] text-slate-700" />
            </button>
          )}

          {/* Navigate to /graph/:id */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/graph/${id}`);
            }}
            className="
              bg-white border border-slate-200
              w-8 h-8 rounded-lg
              flex items-center justify-center
              hover:bg-slate-50
              transition-all duration-150
            "
            title="Open as root graph"
          >
            <ExternalLink size={18} />
          </button>
        </div>
        </div>
        
      </div>
    </div>
  );
}

/* ---------- MINIMAL COMPANY NODE (CIRCLE, WITH INITIAL) ---------- */

function MinimalCompanyDisplay({ id, selected, data }) {
  const initial = useMemo(() => getInitial(data.label), [data.label]);

  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-1
        text-[10px] font-semibold text-slate-700
      `}
      title={data.label}
    >
      <div
        className={`
          h-11 w-11
          rounded-full
          flex flex-col items-center justify-center
          bg-white
          border
          ${
            selected
              ? "border-indigo-500 shadow-[0_0_0_2px_rgba(129,140,248,0.5)] shadow-indigo-200/80"
              : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
          }
          transition-all duration-150
          cursor-pointer
        `}
      >
        <div
          className="
            h-full w-full
            rounded-full
            flex flex-col items-center justify-center
            bg-gradient-to-br from-indigo-50 to-purple-50
          "
        >
          <StoreIcon className="!text-[18px] text-slate-700 mb-0.5" />
          <span className="leading-none text-indigo-700">{initial}</span>
        </div>

        <Handle type="source" position="bottom" />
        <Handle type="target" position="top" />
      </div>
    </div>
  );
}

export const companyNodeTypes = {
  default_company_display: DefaultCompanyDisplay,
  main_company_display: MainCompanyDisplay,
  minimal_company_display: MinimalCompanyDisplay,
};
